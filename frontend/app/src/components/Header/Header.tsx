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
import {
  BaseButton,
  BaseButtonKind,
  DynamicIcon,
  Icon,
  LibContext,
} from "@streamlit/lib"
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

const Header = ({
  isStale,
  hasSidebar,
  isSidebarOpen,
  onToggleSidebar,
  navigation,
  rightContent,
  logoComponent,
}: HeaderProps): ReactElement => {
  const { wideMode, embedded, showToolbar, showColoredLine } =
    useContext(AppContext)
  const { activeTheme } = useContext(LibContext)

  const showHeader = !embedded || showToolbar || showColoredLine
  const hasContent = navigation || rightContent

  return (
    <StyledHeader
      showHeader={showHeader}
      isWideMode={wideMode}
      tabIndex={-1} // required for testing
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
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              width: "100%",
              margin: 0,
              border: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
              }}
            >
              {logoComponent && !isSidebarOpen && (
                <div style={{ marginLeft: 12 }}>{logoComponent}</div>
              )}
              {hasSidebar && !isSidebarOpen && (
                <BaseButton
                  kind={BaseButtonKind.HEADER_NO_PADDING}
                  onClick={onToggleSidebar}
                >
                  <DynamicIcon
                    size="xl"
                    iconValue={":material/keyboard_double_arrow_right:"}
                    color={activeTheme.emotion.colors.fadedText60}
                  />
                </BaseButton>
              )}
            </div>
            {navigation}
            {rightContent && (
              <div
                style={{
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  marginLeft: "auto",
                  height: "100%",
                  minWidth: "19.5rem",
                  marginRight: "1rem",
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
