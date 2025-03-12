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
import { LibContext } from "@streamlit/lib"

import {
  StyledHeader,
  StyledHeaderDecoration,
  StyledHeaderToolbar,
} from "./styled-components"

export interface HeaderProps {
  isStale?: boolean
  navigation?: ReactNode
  rightContent?: ReactNode
  logoComponent?: ReactNode
}

function Header({
  isStale,
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
      {showColoredLine && (
        <StyledHeaderDecoration
          className="stDecoration"
          data-testid="stDecoration"
          id="stDecoration"
        />
      )}
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
              {logoComponent && (
                <div style={{ marginLeft: "12px", marginRight: "12px" }}>
                  {logoComponent}
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
