import { VSCodeDropdown, VSCodeOption } from "@vscode/webview-ui-toolkit/react"
import React from "react"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { updateSetting } from "./utils/settingsHandlers"

import { useTranslation } from "react-i18next";

const PreferredLanguageSetting: React.FC = () => {
	const { t } = useTranslation();
	const { preferredLanguage } = useExtensionState()

	const handleLanguageChange = (newLanguage: string) => {
		updateSetting("preferredLanguage", newLanguage)
	}

	return (
		<div style={{}}>
			<label className="block mb-1 text-sm font-medium" htmlFor="preferred-language-dropdown">
				{t("settings.general.preferred_language.label")}
			</label>
			<VSCodeDropdown
				currentValue={preferredLanguage || "English"}
				id="preferred-language-dropdown"
				onChange={(e: any) => {
					handleLanguageChange(e.target.value)
				}}
				style={{ width: "100%" }}>
				<VSCodeOption value="English">English</VSCodeOption>
				<VSCodeOption value="Arabic - العربية">Arabic - العربية</VSCodeOption>
				<VSCodeOption value="Portuguese - Português (Brasil)">Portuguese - Português (Brasil)</VSCodeOption>
				<VSCodeOption value="Czech - Čeština">Czech - Čeština</VSCodeOption>
				<VSCodeOption value="French - Français">French - Français</VSCodeOption>
				<VSCodeOption value="German - Deutsch">German - Deutsch</VSCodeOption>
				<VSCodeOption value="Hindi - हिन्दी">Hindi - हिन्दी</VSCodeOption>
				<VSCodeOption value="Hungarian - Magyar">Hungarian - Magyar</VSCodeOption>
				<VSCodeOption value="Italian - Italiano">Italian - Italiano</VSCodeOption>
				<VSCodeOption value="Japanese - 日本語">Japanese - 日本語</VSCodeCodeOption>
				<VSCodeOption value="Korean - 한국어">Korean - 한국어</VSCodeOption>
				<VSCodeOption value="Polish - Polski">Polish - Polski</VSCodeOption>
				<VSCodeOption value="Portuguese - Português (Portugal)">Portuguese - Português (Portugal)</VSCodeOption>
				<VSCodeOption value="Russian - Русский">Russian - Русский</VSCodeOption>
				<VSCodeOption value="Simplified Chinese - 简体中文">Simplified Chinese - 简体中文</VSCodeOption>
				<VSCodeOption value="Spanish - Español">Spanish - Español</VSCodeOption>
				<VSCodeOption value="Traditional Chinese - 繁體中文">Traditional Chinese - 繁體中文</VSCodeOption>
				<VSCodeOption value="Turkish - Türkçe">Turkish - Türkçe</VSCodeOption>
				<VSCodeOption value="Vietnamese - Tiếng Việt">Vietnamese - Tiếng Việt</VSCodeOption>
			</VSCodeDropdown>
			<p className="text-xs text-[var(--vscode-descriptionForeground)] mt-1">
				{t("settings.general.preferred_language.description")}
			</p>
		</div>
	)
}
