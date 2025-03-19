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

import React from "react"
import { StatefulPopover } from "baseui/popover"
import { PLACEMENT } from "baseui/popover"
import SidebarNavLink from "../Sidebar/SidebarNavLink"
import { MoreVert } from "@emotion-icons/material-outlined"
import { BaseButton, BaseButtonKind, Icon, LibContext } from "@streamlit/lib"
import { KeyboardArrowDown } from "@emotion-icons/material-outlined"
import { isNullOrUndefined } from "@streamlit/utils"
import { StyledNavSection } from "./styled-components"

interface NavSectionProps {
  handlePageChange: (pageScriptHash: string) => void
  title: string
  pages: {
    isActive: boolean
    pageUrl: string
    icon: string | undefined | null
    onClick: (e: React.MouseEvent) => void
    pageName: string
    children: string[]
    isDisabled: boolean
    pageScriptHash: string
  }[]
}

const NavSection = ({ title, pages, handlePageChange }: NavSectionProps) => {
  if (isNullOrUndefined(pages) || pages.length === 0) {
    return null
  }

  return (
    <StatefulPopover
      triggerType="hover"
      placement={PLACEMENT.bottom}
      content={
        <div style={{ padding: "8px 2px" }}>
          {pages.map(item => {
            const handleClick = (e: React.MouseEvent) => {
              e.preventDefault()
              if (!item.isDisabled) {
                handlePageChange(item.pageScriptHash)
              }
              return false
            }
            return (
              <SidebarNavLink
                {...item}
                onClick={handleClick}
                pageUrl={item.pageUrl}
              >
                {item.pageName}
              </SidebarNavLink>
            )
          })}
        </div>
      }
    >
      <StyledNavSection>
        {title}
        <Icon content={KeyboardArrowDown} size="lg" />
      </StyledNavSection>
    </StatefulPopover>
  )
}

export default NavSection
