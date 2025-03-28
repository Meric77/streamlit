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
import { Icon } from "@streamlit/lib"
import { KeyboardArrowDown } from "@emotion-icons/material-outlined"
import { isNullOrUndefined } from "@streamlit/utils"
import {
  StyledNavSection,
  SidebarNavLinkContainer,
  StyledSidebarNavLinkContainer,
  StyledNavSectionText,
} from "./styled-components"
import { IAppPage } from "@streamlit/protobuf"
import { StreamlitEndpoints } from "@streamlit/connection"
interface NavSectionProps {
  handlePageChange: (pageScriptHash: string) => void
  title: string
  sections: IAppPage[][]
  endpoints: StreamlitEndpoints
  pageLinkBaseUrl: string
  currentPageScriptHash: string
  hideChevron?: boolean
}

const NavSection = ({
  title,
  sections,
  handlePageChange,
  endpoints,
  pageLinkBaseUrl,
  currentPageScriptHash,
  hideChevron = false,
}: NavSectionProps) => {
  if (
    isNullOrUndefined(sections) ||
    sections.length === 0 ||
    sections[0].length === 0
  ) {
    return null
  }

  const showSections = sections.length > 1

  return (
    <StatefulPopover
      triggerType="click"
      placement={PLACEMENT.bottomLeft}
      content={
        <div style={{ padding: "0.25rem 0" }}>
          {sections.map(section => {
            const sectionName = section[0].sectionHeader

            return section.map((item, index) => {
              const handleClick = (e: React.MouseEvent) => {
                e.preventDefault()
                if (item.pageScriptHash) {
                  handlePageChange(item.pageScriptHash)
                }
                return false
              }
              return (
                <>
                  {index === 0 && showSections && <div>{sectionName}</div>}
                  <StyledSidebarNavLinkContainer>
                    <SidebarNavLink
                      {...item}
                      isTopNav={true}
                      isActive={currentPageScriptHash === item.pageScriptHash}
                      onClick={handleClick}
                      pageUrl={endpoints.buildAppPageURL(
                        pageLinkBaseUrl,
                        item
                      )}
                    >
                      {String(item.pageName)}
                    </SidebarNavLink>
                  </StyledSidebarNavLinkContainer>
                </>
              )
            })
          })}
        </div>
      }
    >
      <StyledNavSection>
        <StyledNavSectionText>{title}</StyledNavSectionText>
        {!hideChevron && <Icon content={KeyboardArrowDown} size="lg" />}
      </StyledNavSection>
    </StatefulPopover>
  )
}

export default NavSection
