/**
 * Copyright (c) Streamlit Inc. (2018-2022) Snowflake Inc. (2022-2025)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, {
  memo,
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
  ReactElement,
  MouseEvent,
} from "react"
import { EmotionTheme } from "@streamlit/lib"
import { StreamlitMarkdown } from "@streamlit/lib"
import { StyledTopNavContainer } from "./styled-components"
import SidebarNavLink from "../Sidebar/SidebarNavLink"
import NavSection from "./NavSection"
import groupBy from "lodash/groupBy"

export interface Props {
  // Endpoint data for the current application
  endpoints: any
  // Theme configuration to apply
  theme: EmotionTheme
  // The currently active page
  currentPageScriptHash: string
  // Array of available app pages
  appPages: any[]
  // Called when the user selects a different page
  onPageChange: (pageScriptHash: string) => void
  // Optional URL prefix for page links
  pageLinkBaseUrl?: string
}

// Simplified TopNav component to match the clean, minimal design
const TopNav: React.FC<Props> = ({
  endpoints,
  theme,
  currentPageScriptHash,
  appPages,
  onPageChange,
  pageLinkBaseUrl,
}) => {
  console.log("appPages", appPages)

  // Create a stable callback for the page change handler
  const handlePageChange = useCallback(
    (scriptHash: string) => {
      console.log("handlePageChange", scriptHash)
      onPageChange(scriptHash)
    },
    [onPageChange]
  )

  const tabListRef = useRef<HTMLDivElement>(null)
  const [isOverflowing, setIsOverflowing] = useState(false)
  const [hoverTabIndex, setHoverTabIndex] = useState<number | null>(null)

  // Calculate the active tab key from the current page script hash
  const activeTabKey = useMemo(() => {
    const index = appPages.findIndex(
      page =>
        (page.pageScriptHash || page.scriptHash) === currentPageScriptHash
    )
    return index >= 0 ? index : 0
  }, [appPages, currentPageScriptHash])

  // Check for overflow in the tab list
  useEffect(() => {
    if (tabListRef.current) {
      const { scrollWidth, clientWidth } = tabListRef.current
      setIsOverflowing(scrollWidth > clientWidth)
    }
  }, [appPages])

  const navSections = useMemo(() => {
    return groupBy(appPages, "sectionHeader")
  }, [appPages])

  console.log("navSections", navSections)

  return (
    <>
      <StyledTopNavContainer
        theme={theme}
        data-testid="stTopNav"
        isOverflowing={isOverflowing}
        tabHeight={theme.sizes.tabHeight}
      >
        <div
          ref={tabListRef}
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center", // Center the tabs
            padding: "0.5rem 1rem",
          }}
        >
          {Object.keys(navSections).length > 1
            ? Object.keys(navSections).map(section => {
                return (
                  <NavSection
                    handlePageChange={handlePageChange}
                    title={section}
                    pages={navSections[section]}
                  />
                )
              })
            : appPages.map((page, index) => {
                const pageName = page.pageName || ""
                const scriptHash = page.pageScriptHash || page.scriptHash || ""
                const icon = page.icon || ""
                const isActive = activeTabKey === index
                const isDisabled = page.disabled || false

                // Create a URL for the page (similar logic to what's in SidebarNav)
                const pageUrl = pageLinkBaseUrl
                  ? `${pageLinkBaseUrl}/${page.pageName}`
                  : `/${page.pageName}`

                // Generate click handler for this specific navigation item
                const handleClick = (e: MouseEvent) => {
                  e.preventDefault()
                  if (!isDisabled) {
                    handlePageChange(scriptHash)
                  }
                  return false
                }

                return (
                  <div
                    key={scriptHash}
                    data-testid={`nav-${pageName}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      opacity: isDisabled ? 0.5 : 1,
                      cursor: isDisabled ? "not-allowed" : "pointer",
                      pointerEvents: isDisabled ? "none" : "auto",
                      marginLeft: "-12px",
                      marginRight: "-12px",
                    }}
                    onMouseEnter={() => setHoverTabIndex(index)}
                    onMouseLeave={() => setHoverTabIndex(null)}
                  >
                    {/* Using SidebarNavLink to maintain UI consistency */}
                    <SidebarNavLink
                      isActive={isActive}
                      pageUrl={pageUrl}
                      icon={icon}
                      onClick={handleClick}
                    >
                      {pageName}
                    </SidebarNavLink>
                  </div>
                )
              })}
        </div>
      </StyledTopNavContainer>
    </>
  )
}

export default memo(TopNav)
