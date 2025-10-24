import { ExtensionMessage } from "@shared/ExtensionMessage"
import { ResetStateRequest } from "@shared/proto/cline/state"
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"
import debounce from "debounce"
import {
	CheckCheck,
	FlaskConical,
	Info,
	LucideIcon,
	SlidersHorizontal,
	SquareMousePointer,
	SquareTerminal,
	Wrench,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useEvent } from "react-use"
import HeroTooltip from "@/components/common/HeroTooltip"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { StateServiceClient } from "@/services/grpc-client"
import { getEnvironmentColor } from "@/utils/environmentColors"
import { Tab, TabContent, TabHeader, TabList, TabTrigger } from "../common/Tab"
import SectionHeader from "./SectionHeader"
import AboutSection from "./sections/AboutSection"
import ApiConfigurationSection from "./sections/ApiConfigurationSection"
import BrowserSettingsSection from "./sections/BrowserSettingsSection"
import DebugSection from "./sections/DebugSection"
import FeatureSettingsSection from "./sections/FeatureSettingsSection"
import GeneralSettingsSection from "./sections/GeneralSettingsSection"
import TerminalSettingsSection from "./sections/TerminalSettingsSection"

const IS_DEV = process.env.IS_DEV

// Styles for the tab system
const settingsTabsContainer = "flex flex-1 overflow-hidden [&.narrow_.tab-label]:hidden"
const settingsTabList =
	"w-48 data-[compact=true]:w-12 flex-shrink-0 flex flex-col overflow-y-auto overflow-x-hidden border-r border-[var(--vscode-sideBar-background)]"
const settingsTabTrigger =
	"whitespace-nowrap overflow-hidden min-w-0 h-12 px-4 py-3 box-border flex items-center border-l-2 border-transparent text-[var(--vscode-foreground)] opacity-70 bg-transparent hover:bg-[var(--vscode-list-hoverBackground)] data-[compact=true]:w-12 data-[compact=true]:p-4 cursor-pointer"
const settingsTabTriggerActive =
	"opacity-100 border-l-2 border-l-[var(--vscode-focusBorder)] border-t-0 border-r-0 border-b-0 bg-[var(--vscode-list-activeSelectionBackground)]"

import { useTranslation } from "react-i18next";

// Tab definitions
interface SettingsTab {
	id: string
	name: string
	tooltipText: string
	headerText: string
	icon: LucideIcon
	hidden?: boolean
}

export const getSettingsTabs = (t: (key: string) => string): SettingsTab[] => [
	{
		id: "api-config",
		name: t("settings.tabs.api_configuration"),
		tooltipText: t("settings.tabs.api_configuration"),
		headerText: t("settings.tabs.api_configuration"),
		icon: SlidersHorizontal,
	},
	{
		id: "features",
		name: t("settings.tabs.features"),
		tooltipText: t("settings.tabs.features"),
		headerText: t("settings.tabs.features"),
		icon: CheckCheck,
	},
	{
		id: "browser",
		name: t("settings.tabs.browser"),
		tooltipText: t("settings.tabs.browser"),
		headerText: t("settings.tabs.browser"),
		icon: SquareMousePointer,
	},
	{
		id: "terminal",
		name: t("settings.tabs.terminal"),
		tooltipText: t("settings.tabs.terminal"),
		headerText: t("settings.tabs.terminal"),
		icon: SquareTerminal,
	},
	// Only show in dev mode
	{
		id: "debug",
		name: t("settings.tabs.debug"),
		tooltipText: t("settings.tabs.debug"),
		headerText: t("settings.tabs.debug"),
		icon: FlaskConical,
		hidden: !IS_DEV,
	},
	{
		id: "general",
		name: t("settings.tabs.general"),
		tooltipText: t("settings.tabs.general"),
		headerText: t("settings.tabs.general"),
		icon: Wrench,
	},
	{
		id: "about",
		name: t("settings.tabs.about"),
		tooltipText: t("settings.tabs.about"),
		headerText: t("settings.tabs.about"),
		icon: Info,
	},
]

type SettingsViewProps = {
	onDone: () => void
	targetSection?: string
}

// Helper to render section header - moved outside component for better performance
const renderSectionHeader = (tabId: string, t: (key: string) => string) => {
	const tab = getSettingsTabs(t).find((t) => t.id === tabId)
	if (!tab) {
		return null
	}

	return (
		<SectionHeader>
			<div className="flex items-center gap-2">
				<tab.icon className="w-4" />
				<div>{tab.headerText}</div>
			</div>
		</SectionHeader>
	)
}

const SettingsView = ({ onDone, targetSection }: SettingsViewProps) => {
	const { t } = useTranslation();
	const SETTINGS_TABS = getSettingsTabs(t);

	// Memoize to avoid recreation
	const TAB_CONTENT_MAP = useMemo(
		() => ({
			"api-config": ApiConfigurationSection,
			general: GeneralSettingsSection,
			features: FeatureSettingsSection,
			browser: BrowserSettingsSection,
			terminal: TerminalSettingsSection,
			about: AboutSection,
			debug: DebugSection,
		}),
		[],
	) // Empty deps - these imports never change

	const { version, environment } = useExtensionState()

	// Initialize active tab with memoized calculation
	const initialTab = useMemo(() => targetSection || SETTINGS_TABS[0].id, [targetSection, SETTINGS_TABS])

	const [activeTab, setActiveTab] = useState<string>(initialTab)
	const [isCompactMode, setIsCompactMode] = useState(true)
	const containerRef = useRef<HTMLDivElement>(null)

	// Optimized message handler with early returns
	const handleMessage = useCallback((event: MessageEvent) => {
		const message: ExtensionMessage = event.data
		if (message.type !== "grpc_response") {
			return
		}

		const grpcMessage = message.grpc_response?.message
		if (grpcMessage?.key !== "scrollToSettings") {
			return
		}

		const tabId = grpcMessage.value
		if (!tabId) {
			return
		}

		// Check if valid tab ID
		if (SETTINGS_TABS.some((tab) => tab.id === tabId)) {
			setActiveTab(tabId)
			return
		}

		// Fallback to element scrolling
		requestAnimationFrame(() => {
			const element = document.getElementById(tabId)
			if (!element) {
				return
			}

			element.scrollIntoView({ behavior: "smooth" })
			element.style.transition = "background-color 0.5s ease"
			element.style.backgroundColor = "var(--vscode-textPreformat-background)"

			setTimeout(() => {
				element.style.backgroundColor = "transparent"
			}, 1200)
		})
	}, [SETTINGS_TABS])

	useEvent("message", handleMessage)

	// Memoized reset state handler
	const handleResetState = useCallback(async (resetGlobalState?: boolean) => {
		try {
			await StateServiceClient.resetState(ResetStateRequest.create({ global: resetGlobalState }))
		} catch (error) {
			console.error("Failed to reset state:", error)
		}
	}, [])

	// Update active tab when targetSection changes
	useEffect(() => {
		if (targetSection) {
			setActiveTab(targetSection)
		}
	}, [targetSection])

	// Simplified tab change handler without debugging
	const handleTabChange = useCallback((tabId: string) => {
		setActiveTab(tabId)
	}, [])

	// Optimized resize observer with debouncing
	useEffect(() => {
		const container = containerRef.current
		if (!container) {
			return
		}

		const checkCompactMode = debounce((width: number) => {
			setIsCompactMode(width < 500)
		}, 100)

		const observer = new ResizeObserver((entries) => {
			const entry = entries[0]
			if (entry) {
				checkCompactMode(entry.contentRect.width)
			}
		})

		observer.observe(container)
		return () => observer.disconnect()
	}, [])

	// Memoized tab item renderer
	const renderTabItem = useCallback(
		(tab: (typeof SETTINGS_TABS)[0]) => {
			const isActive = activeTab === tab.id
			const tabClassName = `${isActive ? `${settingsTabTrigger} ${settingsTabTriggerActive}` : settingsTabTrigger} focus:ring-0`
			const iconContainerClassName = `flex items-center gap-2 ${isCompactMode ? "justify-center" : ""}`

			const TabIcon = tab.icon
			const tabContent = (
				<div className={iconContainerClassName}>
					<TabIcon className="w-4 h-4" />
					<span className="tab-label">{tab.name}</span>
				</div>
			)

			if (isCompactMode) {
				return (
					<HeroTooltip content={tab.tooltipText} key={tab.id} placement="right">
						<div
							className={tabClassName}
							data-compact={isCompactMode}
							data-testid={`tab-${tab.id}`}
							data-value={tab.id}
							onClick={() => handleTabChange(tab.id)}>
							{tabContent}
						</div>
					</HeroTooltip>
				)
			}

			return (
				<TabTrigger
					className={tabClassName}
					data-compact={isCompactMode}
					data-testid={`tab-${tab.id}`}
					key={tab.id}
					value={tab.id}>
					{tabContent}
				</TabTrigger>
			)
		},
		[activeTab, isCompactMode, handleTabChange],
	)

	// Memoized active content component
	const ActiveContent = useMemo(() => {
		const Component = TAB_CONTENT_MAP[activeTab as keyof typeof TAB_CONTENT_MAP]
		if (!Component) {
			return null
		}

		// Special props for specific components
		const props: any = { renderSectionHeader: (tabId: string) => renderSectionHeader(tabId, t) }
		if (activeTab === "debug") {
			props.onResetState = handleResetState
		} else if (activeTab === "about") {
			props.version = version
		}

		return <Component {...props} />
	}, [activeTab, handleResetState, version, t])

	const titleColor = getEnvironmentColor(environment)

	return (
		<Tab>
			<TabHeader className="flex justify-between items-center gap-2">
				<div className="flex items-center gap-1">
					<h3 className="m-0" style={{ color: titleColor }}>
						{t("settings.title")}
					</h3>
				</div>
				<div className="flex gap-2">
					<VSCodeButton onClick={onDone}>{t("settings.done_button")}</VSCodeButton>
				</div>
			</TabHeader>

			<div className={`${settingsTabsContainer} ${isCompactMode ? "narrow" : ""}`} ref={containerRef}>
				<TabList
					className={settingsTabList}
					data-compact={isCompactMode}
					onValueChange={handleTabChange}
					value={activeTab}>
					{SETTINGS_TABS.filter((tab) => !tab.hidden).map(renderTabItem)}
				</TabList>

				<TabContent className="flex-1 overflow-auto">{ActiveContent}</TabContent>
			</div>
		</Tab>
	)
}

export default SettingsView
