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
import { EmotionTheme } from "@streamlit/lib"

export interface StyledHeaderProps {
  showHeader: boolean
  isWideMode: boolean
  isStale?: boolean
}

export const StyledHeader = styled.header<{
  theme: EmotionTheme
}>`
  display: flex;
  flex-direction: column;
  width: 100%;
  background-color: ${({ theme }) => theme.colors?.bgColor || "white"};
  min-height: 3.6rem;
  height: 3.6rem;
  z-index: 100;
  pointer-events: auto;
  position: relative;
  will-change: transform; /* Hint for browser optimization */
  transform: translateZ(0); /* Force GPU rendering */
  /* Define explicit rendering layer - prevents paint issues */
  backface-visibility: hidden;
  -webkit-font-smoothing: subpixel-antialiased;
`

export const StyledHeaderDecoration = styled.div(({ theme }) => ({
  position: "absolute",
  top: theme.spacing.none,
  right: theme.spacing.none,
  left: theme.spacing.none,
  height: `calc(${theme.sizes.headerDecorationHeight} * 0.6)` /* Reduced to 50% of the increased height */,
  backgroundImage: `linear-gradient(90deg, ${theme.colors.red70}, #fffd80)`,
  zIndex: 50 /* Lowered from theme.zIndices.header to ensure it's below nav elements */,
}))

export const StyledHeaderToolbar = styled.div<{
  theme: EmotionTheme
}>`
  display: flex;
  align-items: center;
  height: 100%;
  width: 100%;
  padding: 0;
  pointer-events: auto;
  position: relative;
  z-index: 101;
`
