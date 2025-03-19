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

import React, { ReactElement, ReactNode, useContext } from "react"

import { AppContext } from "@streamlit/app/src/components/AppContext"
import { BaseButton, BaseButtonKind, Icon, LibContext } from "@streamlit/lib"

import { StyledHeader, StyledHeaderToolbar } from "./styled-components"
import { ChevronRight } from "@emotion-icons/material-outlined"

export interface HeaderProps {
  isStale?: boolean
  hasSidebar: boolean
  isSidebarOpen: boolean
  onToggleSidebar(): void
  navigation?: ReactNode
  rightContent?: ReactNode
  logoComponent?: ReactNode
}

function Header({
  isStale,
  hasSidebar,
  isSidebarOpen,
  onToggleSidebar,
  navigation,
  rightContent,
  logoComponent,
}: Readonly<HeaderProps>): ReactElement {
  const { wideMode, embedded, showToolbar, showColoredLine } =
    useContext(AppContext)

  // Get the active theme from LibContext
  const { activeTheme } = useContext(LibContext)

  let showHeader = true
  if (embedded) {
    showHeader = showToolbar || showColoredLine
  }

  const hasContent = navigation || rightContent

  return (
    <StyledHeader
      showHeader={showHeader}
      isWideMode={wideMode}
      // The tabindex below is required for testing.
      tabIndex={-1}
      isStale={isStale}
      className="stAppHeader"
      data-testid="stHeader"
    >
      {showToolbar && hasContent && (
        <StyledHeaderToolbar
          className="stAppToolbar"
          data-testid="stToolbar"
          theme={activeTheme.emotion}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              width: "100%",
              margin: 0,
              border: 0,
            }}
          >
            {/* Logo and navigation section */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
              }}
            >
              {/* Logo comes first if provided */}
              {logoComponent && !isSidebarOpen && (
                <div
                  style={{
                    marginLeft: "12px",
                  }}
                >
                  {logoComponent}
                </div>
              )}

              {hasSidebar && !isSidebarOpen && (
                <div
                  style={{
                    marginLeft: "12px",
                    marginRight: "12px",
                  }}
                >
                  <BaseButton
                    kind={BaseButtonKind.HEADER_NO_PADDING}
                    onClick={onToggleSidebar}
                  >
                    <Icon content={ChevronRight} size="xl" />
                  </BaseButton>
                </div>
              )}

              {/* Navigation follows logo */}
              {navigation && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                  }}
                >
                  {navigation}
                </div>
              )}
            </div>

            {/* Right section */}
            {rightContent && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginLeft: "auto",
                  height: "100%",
                }}
              >
                {rightContent}
              </div>
            )}
          </div>
        </StyledHeaderToolbar>
      )}
    </StyledHeader>
  )
}

export default Header
