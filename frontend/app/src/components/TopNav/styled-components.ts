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
import { transparentize } from "color2k"
import { hasLightBackgroundColor } from "@streamlit/lib"
import type { EmotionTheme } from "@streamlit/lib"
import { getNavTextColor } from "../Sidebar/styled-components"

export interface StyledTopNavContainerProps {
  theme: EmotionTheme
  isOverflowing?: boolean
  tabHeight?: string | number
}

export const StyledOverflowContainer = styled.div({
  display: "flex",
  alignItems: "center",
  width: "100%",
  maxWidth: "100%",
  flexShrink: 1,
})

export const StyledTopNavItems = styled.div`
  display: flex;
  align-items: center;
  height: 3.6rem;
  position: relative;
  /* Disable transitions and transforms */
  transition: none !important;
  transform: none !important;
  /* Ensure no layout shifts */
  white-space: nowrap;
  /* Re-enable pointer events for child elements */
  pointer-events: none;
  z-index: 91; /* Ensure items have appropriate z-index */
`

export const StyledTopNavLink = styled.a<{
  isActive: boolean
  theme: EmotionTheme
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 3.6rem;
  padding: 0 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ theme, isActive }) => getNavTextColor(theme, isActive)};
  text-decoration: none;
  position: relative;
  /* Only transition color, not layout properties */
  transition: color 0.15s linear;
  cursor: pointer;
  /* Re-enable pointer events */
  pointer-events: auto;
  box-sizing: border-box;
  user-select: none;
  white-space: nowrap;
  z-index: 92; /* Ensure links have appropriate z-index */

  /* Stable active indicator using pseudo-element */
  &::after {
    content: "";
    position: absolute;
    bottom: 6px;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: ${({ theme, isActive }) =>
      isActive ? theme.colors?.primary || "#FF4B4B" : "transparent"};
    /* Don't transition layout-affecting properties */
    transition: background-color 0.15s linear;
    pointer-events: none;
    z-index: 150; /* Much higher z-index to ensure it appears above the decoration bar */
  }

  /* Ensure hover doesn't cause layout shifts */
  &:hover,
  &:focus {
    color: ${({ theme }) => theme.colors?.primary || "#FF4B4B"};
    outline: none;
  }
`

export const StyledTopNavIcon = styled.div<{
  isActive: boolean
  theme: EmotionTheme
}>`
  display: inline-flex; /* More stable than flex */
  align-items: center;
  justify-content: center;
  margin-right: 0.5rem;
  box-sizing: border-box;
  flex-shrink: 0; /* Prevent shrinking */
  width: 1.25rem; /* Fixed width */
  height: 1.25rem; /* Fixed height */
  min-width: 1.25rem; /* Ensure minimum width */
  min-height: 1.25rem; /* Ensure minimum height */
  overflow: visible; /* Allow content to overflow without shifting layout */
  transform: translateZ(0); /* Force GPU acceleration */
  will-change: transform; /* Hardware acceleration hint */
  position: relative; /* Create stacking context */
  contain: layout size; /* Size containment for performance */
  line-height: 0; /* Remove line height influence */
`

export const StyledTopNavSectionSeparator = styled.div<{
  theme: EmotionTheme
}>`
  height: 1.5rem;
  width: 1px;
  margin: 0 0.5rem;
  align-self: center;
  flex-shrink: 0; /* Don't allow shrinking */
  background-color: ${({ theme }) =>
    transparentize(theme.colors?.fadedText10 || "#7F7F7F", 0.8)};
  transform: translateZ(0); /* Force GPU layer */
  will-change: transform; /* Hardware acceleration hint */
  pointer-events: none; /* Don't capture events */
`

export const StyledNavSection = styled.div(({ theme }) => ({
  marginLeft: "8px",
  marginRight: "8px",
  display: "flex",
  alignItems: "center",
  width: "100%",
  cursor: "pointer",
  position: "relative",
  padding: "4px 8px",
  lineHeight: "2rem",
  color: getNavTextColor(theme, false, true),
  "&:active": {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: "4px",
  },
}))

export const StyledTopNavLinkContainer = styled.div(({ theme }) => ({
  margin: `${theme.spacing.sm} ${theme.spacing.sm}`,
}))
