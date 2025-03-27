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
  ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"

import { ChevronLeft, ChevronRight } from "@emotion-icons/material-outlined"
import { useTheme } from "@emotion/react"
import { getLogger } from "loglevel"
import { Resizable } from "re-resizable"

import { StreamlitEndpoints } from "@streamlit/connection"
import {
  BaseButton,
  BaseButtonKind,
  DynamicIcon,
  EmotionTheme,
  Icon,
  isColoredLineDisplayed,
  isEmbed,
  IsSidebarContext,
  LibContext,
} from "@streamlit/lib"
import { IAppPage, Logo, PageConfig } from "@streamlit/protobuf"
import { localStorageAvailable } from "@streamlit/utils"
import { shouldCollapse } from "@streamlit/app/src/components/Sidebar/utils"

import {
  RESIZE_HANDLE_WIDTH,
  StyledCollapseSidebarButton,
  StyledLogo,
  StyledLogoLink,
  StyledNoLogoSpacer,
  StyledOpenSidebarButton,
  StyledResizeHandle,
  StyledSidebar,
  StyledSidebarContent,
  StyledSidebarHeaderContainer,
  StyledSidebarOpenContainer,
  StyledSidebarUserContent,
} from "./styled-components"
import SidebarNav from "./SidebarNav"

export interface SidebarProps {
  endpoints: StreamlitEndpoints
  children?: ReactElement
  initialSidebarState?: PageConfig.SidebarState
  hasElements: boolean
  appLogo: Logo | null
  appPages: IAppPage[]
  navSections: string[]
  onPageChange: (pageName: string) => void
  currentPageScriptHash: string
  hideSidebarNav: boolean
  expandSidebarNav: boolean
  isCollapsed: boolean
  onToggleCollapse: (collapsed: boolean) => void
}

const MIN_WIDTH = "336"

const LOG = getLogger("Sidebar")

function calculateMaxBreakpoint(value: string): number {
  // We subtract a margin of 0.02 to use as a max-width
  return parseInt(value, 10) - 0.02
}

const Sidebar: React.FC<SidebarProps> = ({
  appLogo,
  endpoints,
  appPages,
  children,
  initialSidebarState,
  hasElements,
  onPageChange,
  currentPageScriptHash,
  hideSidebarNav,
  expandSidebarNav,
  navSections,
  isCollapsed,
  onToggleCollapse,
}) => {
  const theme: EmotionTheme = useTheme()
  const mediumBreakpointPx = calculateMaxBreakpoint(theme.breakpoints.md)
  const sideBarInitiallyCollapsed = shouldCollapse(
    initialSidebarState,
    mediumBreakpointPx
  )

  const sidebarRef = useRef<HTMLDivElement>(null)

  const cachedSidebarWidth = localStorageAvailable()
    ? window.localStorage.getItem("sidebarWidth")
    : undefined

  const collapsedSidebar = isCollapsed
  const [sidebarWidth, setSidebarWidth] = useState<string>(
    cachedSidebarWidth || MIN_WIDTH
  )
  const [lastInnerWidth, setLastInnerWidth] = useState<number>(
    window ? window.innerWidth : Infinity
  )

  // When hovering sidebar header
  const [showSidebarCollapse, setShowSidebarCollapse] =
    useState<boolean>(false)

  const onMouseOver = useCallback(() => {
    setShowSidebarCollapse(true)
  }, [])

  const onMouseOut = useCallback(() => {
    setShowSidebarCollapse(false)
  }, [])

  const initializeSidebarWidth = useCallback((width: number): void => {
    const newWidth = width.toString()

    setSidebarWidth(newWidth)

    if (localStorageAvailable()) {
      window.localStorage.setItem("sidebarWidth", newWidth)
    }
  }, [])

  const onResizeStop = useCallback(
    (_e: any, _direction: any, _ref: any, d: any) => {
      const newWidth = parseInt(sidebarWidth, 10) + d.width
      initializeSidebarWidth(newWidth)
    },
    [initializeSidebarWidth, sidebarWidth]
  )

  useEffect(() => {
    const checkMobileOnResize = (): boolean => {
      if (!window) return false

      const { innerWidth } = window

      // Collapse the sidebar if the window was narrowed and is now mobile-sized
      if (innerWidth < lastInnerWidth && innerWidth <= mediumBreakpointPx) {
        if (!collapsedSidebar) {
          onToggleCollapse(true)
        }
      }
      setLastInnerWidth(innerWidth)

      return true
    }

    const handleClickOutside = (event: any): void => {
      if (sidebarRef && window) {
        const { current } = sidebarRef
        const { innerWidth } = window

        if (
          current &&
          !current.contains(event.target) &&
          innerWidth <= mediumBreakpointPx
        ) {
          if (!collapsedSidebar) {
            onToggleCollapse(true)
          }
        }
      }
    }

    window.addEventListener("resize", checkMobileOnResize)
    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      window.removeEventListener("resize", checkMobileOnResize)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [lastInnerWidth, mediumBreakpointPx, collapsedSidebar, onToggleCollapse])

  function resetSidebarWidth(event: any): void {
    // Double clicking on the resize handle resets sidebar to default width
    if (event.detail === 2) {
      setSidebarWidth(MIN_WIDTH)
      if (localStorageAvailable()) {
        window.localStorage.setItem("sidebarWidth", MIN_WIDTH)
      }
    }
  }

  const toggleCollapse = useCallback(() => {
    onToggleCollapse(!collapsedSidebar)
  }, [collapsedSidebar, onToggleCollapse])

  const handleLogoError = (logoUrl: string, collapsed: boolean): void => {
    // StyledLogo does not retain the e.currentEvent.src like other onerror cases
    // store and read from ref instead
    const component = collapsed ? "Logo" : "Sidebar Logo"
    LOG.error(`Client Error: ${component} source error - ${logoUrl}`)
    endpoints.sendClientErrorToHost(
      component,
      "Logo source failed to load",
      "onerror triggered",
      logoUrl
    )
  }

  function renderLogo(collapsed: boolean): ReactElement {
    if (!appLogo) {
      return <StyledNoLogoSpacer data-testid="stLogoSpacer" />
    }

    const displayImage =
      collapsed && appLogo.iconImage ? appLogo.iconImage : appLogo.image
    const source = endpoints.buildMediaURL(displayImage)

    const logo = (
      <StyledLogo
        src={source}
        size={appLogo.size}
        sidebarWidth={sidebarWidth}
        alt="Logo"
        className="stLogo"
        data-testid="stLogo"
        // Save to logo's src to send on load error
        onError={_ => handleLogoError(source, collapsed)}
      />
    )

    if (appLogo.link) {
      return (
        <StyledLogoLink
          href={appLogo.link}
          target="_blank"
          rel="noreferrer"
          data-testid="stLogoLink"
        >
          {logo}
        </StyledLogoLink>
      )
    }
    return logo
  }

  const hasPageNavAbove = appPages.length > 1 && !hideSidebarNav

  // Handles checking the URL params
  const isEmbedded = isEmbed() && !isColoredLineDisplayed()

  // The tabindex is required to support scrolling by arrow keys.
  return (
    <>
      {/* <StyledSidebarOpenContainer
        chevronDownshift={chevronDownshift}
        data-testid="stSidebarCollapsedControl"
      >
        {renderLogo(true)}
        <StyledOpenSidebarButton
          theme={
            // Use the active theme from the LibContext to use the main theme
            // for styling the open button since otherwise it would use the colors
            // of the sidebar theme (which is not what we want here).
            activeTheme.emotion
          }
        >
          <BaseButton
            kind={BaseButtonKind.HEADER_NO_PADDING}
            onClick={toggleCollapse}
          >
            <Icon content={ChevronRight} size="xl" />
          </BaseButton>
        </StyledOpenSidebarButton>
      </StyledSidebarOpenContainer> */}
      <Resizable
        className="stSidebar"
        data-testid="stSidebar"
        aria-expanded={!collapsedSidebar}
        enable={{
          top: false,
          right: true,
          bottom: false,
          left: false,
        }}
        handleStyles={{
          right: {
            width: RESIZE_HANDLE_WIDTH,
            right: "-6px",
          },
        }}
        handleComponent={{
          right: <StyledResizeHandle onClick={resetSidebarWidth} />,
        }}
        size={{
          width: sidebarWidth,
          height: "auto",
        }}
        as={StyledSidebar}
        onResizeStop={onResizeStop}
        // Props part of StyledSidebar, but not Resizable component
        // @ts-expect-error
        isCollapsed={collapsedSidebar}
        sidebarWidth={sidebarWidth}
      >
        <StyledSidebarContent
          data-testid="stSidebarContent"
          ref={sidebarRef}
          onMouseOver={onMouseOver}
          onMouseOut={onMouseOut}
        >
          <StyledSidebarHeaderContainer data-testid="stSidebarHeader">
            {renderLogo(false)}
            <StyledCollapseSidebarButton
              showSidebarCollapse={showSidebarCollapse}
              data-testid="stSidebarCollapseButton"
            >
              <BaseButton
                kind={BaseButtonKind.HEADER_NO_PADDING}
                onClick={toggleCollapse}
              >
                <DynamicIcon
                  size="xl"
                  iconValue={":material/keyboard_double_arrow_left:"}
                  color={theme.colors.fadedText60}
                />
              </BaseButton>
            </StyledCollapseSidebarButton>
          </StyledSidebarHeaderContainer>
          {hasPageNavAbove && (
            <SidebarNav
              endpoints={endpoints}
              appPages={appPages}
              collapseSidebar={toggleCollapse}
              currentPageScriptHash={currentPageScriptHash}
              navSections={navSections}
              hasSidebarElements={hasElements}
              expandSidebarNav={expandSidebarNav}
              onPageChange={onPageChange}
            />
          )}
          <StyledSidebarUserContent
            hasPageNavAbove={hasPageNavAbove}
            data-testid="stSidebarUserContent"
          >
            {children}
          </StyledSidebarUserContent>
        </StyledSidebarContent>
      </Resizable>
    </>
  )
}

function SidebarWithProvider(props: SidebarProps): ReactElement {
  return (
    <IsSidebarContext.Provider value={true}>
      <Sidebar {...props} />
    </IsSidebarContext.Provider>
  )
}

export default SidebarWithProvider
