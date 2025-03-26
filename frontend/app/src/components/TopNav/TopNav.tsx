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

import React, { useMemo } from "react"
import SidebarNavLink from "../Sidebar/SidebarNavLink"
import NavSection from "./NavSection"
import groupBy from "lodash/groupBy"
import Overflow from "rc-overflow"
import { IAppPage } from "@streamlit/protobuf"
import { StreamlitEndpoints } from "@streamlit/connection"
import { StyledOverflowContainer } from "./styled-components"
import { isNullOrUndefined } from "@streamlit/utils"

export interface Props {
  currentPageScriptHash: string
  appPages: IAppPage[]
  onPageChange: (pageScriptHash: string) => void
  pageLinkBaseUrl: string
  endpoints: StreamlitEndpoints
}

const TopNav: React.FC<Props> = ({
  endpoints,
  pageLinkBaseUrl,
  currentPageScriptHash,
  appPages,
  onPageChange,
}) => {
  const navSections = useMemo(() => {
    return groupBy(appPages, "sectionHeader")
  }, [appPages])

  const hasSections = Object.keys(navSections).length > 1

  const data = hasSections
    ? Object.values(navSections)
    : Object.values(navSections).flat()

  return (
    <Overflow<IAppPage | IAppPage[]>
      component={StyledOverflowContainer}
      itemKey={item =>
        Array.isArray(item) ? item[0].sectionHeader! : item.pageScriptHash!
      }
      data={data}
      maxCount={"responsive"}
      renderItem={(item, _info) => {
        if (Array.isArray(item)) {
          return (
            <NavSection
              sections={[item]}
              title={item[0].sectionHeader || ""}
              handlePageChange={onPageChange}
              endpoints={endpoints}
              pageLinkBaseUrl={pageLinkBaseUrl}
              currentPageScriptHash={currentPageScriptHash}
            />
          )
        } else {
          return (
            <SidebarNavLink
              isActive={currentPageScriptHash === item.pageScriptHash}
              icon={item.icon}
              pageUrl={endpoints.buildAppPageURL(pageLinkBaseUrl, item)}
              onClick={e => {
                e.preventDefault()
                if (item.pageScriptHash) {
                  onPageChange(item.pageScriptHash)
                }
              }}
            >
              {String(item.pageName)}
            </SidebarNavLink>
          )
        }
      }}
      renderRest={items => {
        if (isNullOrUndefined(items)) {
          return null
        }

        const totalNumPages = items.flat().length
        const title = `${totalNumPages} more`

        if (Array.isArray(items[0])) {
          return (
            <NavSection
              sections={items as IAppPage[][]}
              title={title}
              handlePageChange={onPageChange}
              endpoints={endpoints}
              pageLinkBaseUrl={pageLinkBaseUrl}
              currentPageScriptHash={currentPageScriptHash}
            />
          )
        } else {
          return (
            <NavSection
              sections={[items as IAppPage[]]}
              title={title}
              handlePageChange={onPageChange}
              endpoints={endpoints}
              pageLinkBaseUrl={pageLinkBaseUrl}
              currentPageScriptHash={currentPageScriptHash}
            />
          )
        }
      }}
    />
  )
}

export default TopNav
