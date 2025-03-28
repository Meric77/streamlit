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

import styled from "@emotion/styled"
import { getNavTextColor } from "../Sidebar/styled-components"

export const StyledOverflowContainer = styled.div({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  width: "100%",
  maxWidth: "100%",
  flexShrink: 1,
})

export const StyledNavSection = styled.div(({ theme }) => ({
  marginLeft: "8px",
  marginRight: "8px",
  display: "flex",
  alignItems: "center",
  height: "2rem",
  cursor: "pointer",
  position: "relative",
  padding: "4px 8px",
  lineHeight: "2rem",
  color: getNavTextColor(theme, false, true),
  borderRadius: "4px",
  "&:hover": {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
}))

export const StyledTopNavLinkContainer = styled.div(({ theme }) => ({
  margin: `${theme.spacing.sm} ${theme.spacing.sm}`,
}))

export const StyledNavSectionText = styled.span(({ theme }) => ({}))

export const StyledSidebarNavLinkContainer = styled.div(({ theme }) => ({
  margin: `${theme.spacing.twoXS} ${theme.spacing.sm}`,
}))
