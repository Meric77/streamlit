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

import { useContext, useMemo } from "react"
import { FlexContext } from "../Flex/FlexContext"

export type UseLayoutStylesArgs<T> = {
  width: React.CSSProperties["width"] | undefined
  element:
    | (T & {
        width?: number | string
        height?: number | string
        useContainerWidth?: boolean | undefined
        flex?: string
        scale?: number
        size?: number | "stretch"
        type?: string
      })
    | undefined
  isFlexContainer: boolean
}

const isNonZeroPositiveNumber = (value: unknown): value is number =>
  typeof value === "number" && value > 0 && !isNaN(value)

export type UseLayoutStylesShape = {
  width: React.CSSProperties["width"]
  maxWidth?: React.CSSProperties["maxWidth"]
  maxHeight?: React.CSSProperties["maxHeight"]
  flex?: React.CSSProperties["flex"]
  height?: React.CSSProperties["height"]
  marginLeft?: React.CSSProperties["marginLeft"]
  marginTop?: React.CSSProperties["marginTop"]
  verticalScroll?: boolean
  alignSelf?: React.CSSProperties["alignSelf"]
}

const validateWidth = (
  width:
    | React.CSSProperties["width"]
    | React.CSSProperties["height"]
    | undefined
): React.CSSProperties["width"] | React.CSSProperties["height"] => {
  if (typeof width === "number") {
    if (width === 0) {
      // An element with no width should be treated as if it has no width set
      // This is likely from the proto, where the default value is 0
      return "auto"
    }

    if (width && width < 0) {
      return "auto"
    }

    if (width !== undefined && isNaN(width)) {
      return "auto"
    }
  }

  return width
}

const checkAndFixOverflow = (
  width: React.CSSProperties["width"],
  containerWidth: React.CSSProperties["width"]
) => {
  if (width === undefined || containerWidth === undefined) {
    return width
  }
  if (
    Number.isInteger(Number(width)) &&
    Number.isInteger(Number(containerWidth))
  ) {
    if (width > containerWidth) {
      return containerWidth
    }
  }
  return width
}

const getWidth = (
  useContainerWidth: boolean | undefined,
  commandWidth: string | number,
  containerWidth: string | number
) => {
  if (useContainerWidth !== undefined && useContainerWidth) {
    return validateWidth(containerWidth)
  }
  if (String(commandWidth) === "stretch") {
    return "100%"
  } else if (!Number.isNaN(Number(commandWidth))) {
    return `${validateWidth(commandWidth)}px`
  } else if (String(commandWidth) === "content") {
    return "fit-content"
  }
  return "auto"
}

const getHeight = (commandHeight: string | number | undefined) => {
  if (String(commandHeight) === "stretch") {
    return "auto"
  } else if (!Number.isNaN(Number(commandHeight))) {
    return `${validateWidth(commandHeight)}px`
  } else if (String(commandHeight) === "content") {
    return "fit-content"
  }
  return "auto"
}

const getFlex = (
  useContainerWidth: boolean | undefined,
  commandWidth: string | number,
  commandHeight: string | number,
  containerWidth: string | number,
  direction: "row" | "column" | undefined,
  scale: number | undefined
) => {
  if (useContainerWidth !== undefined && useContainerWidth) {
    if (!Number.isNaN(Number(containerWidth))) {
      return `1 1 ${validateWidth(containerWidth)}px`
    } else {
      return `1 1 ${containerWidth}`
    }
  }
  if (
    commandWidth === "stretch" &&
    scale !== undefined &&
    direction === "row"
  ) {
    return `${scale}`
  } else if (
    commandHeight === "stretch" &&
    scale !== undefined &&
    direction === "column"
  ) {
    return `${scale}`
  } else if (!Number.isNaN(Number(commandWidth)) && direction === "row") {
    return `0 1 ${validateWidth(commandWidth)}px`
  } else if (
    Number.isInteger(Number(commandHeight)) &&
    direction === "column"
  ) {
    return `0 1 ${validateWidth(commandHeight)}px`
  }
  return undefined
}

const getVerticalScroll = (height: string | number) => {
  return !Number.isNaN(Number(height)) && Number(height) > 0
}

/**
 * Returns the contextually-aware style values for an element container
 */
export const useLayoutStyles = <T>({
  width: containerWidth,
  element,
  isFlexContainer,
}: UseLayoutStylesArgs<T>): UseLayoutStylesShape => {
  /**
   * The width set from the `st.<command>`
   */
  const commandWidth = element?.width
  const commandHeight = element?.height
  const useContainerWidth = element?.useContainerWidth
  const flexContext = useContext(FlexContext)

  let direction: "column" | "row" | undefined
  if (flexContext) {
    if (isFlexContainer) {
      direction = flexContext.parentContainerDirection
    } else {
      direction = flexContext.direction
    }
  }

  // Note: Consider rounding the width to the nearest pixel so we don't have
  // subpixel widths, which leads to blurriness on screen
  const layoutStyles = useMemo((): UseLayoutStylesShape => {
    // If we don't have an element, we are rendering a root-level node, likely a
    // `StyledAppViewBlockContainer`
    if (!element) {
      return {
        width: containerWidth,
      }
    }

    if ("size" in element) {
      const size = element.size
      const isNumeric = !isNaN(Number(size))
      const isStretch = size === "stretch"

      const isHorizontal = direction === "row"

      if (isNumeric) {
        // Fixed size space
        const sizeValue = `${validateWidth(size)}px`

        if (isHorizontal) {
          // In horizontal container, set width
          return {
            width: sizeValue,
          }
        } else {
          // In vertical container, set height
          return {
            width: "100%",
            height: sizeValue,
          }
        }
      } else if (isStretch) {
        // Stretch space - push content to edges
        if (isHorizontal) {
          // In horizontal container, push horizontally
          return {
            marginLeft: "auto",
          }
        } else {
          // In vertical container, push vertically
          return {
            marginTop: "auto",
          }
        }
      }

      // Default fallback if size is not recognized
      return {}
    }

    if ("imgs" in element) {
      /**
       * ImageList overrides its `width` param and handles its own width in the
       * component. There should not be any element-specific carve-outs in this
       * file, but given the long-standing behavior of ImageList, we have to
       * make an exception here.
       *
       * @see WidthBehavior on the Backend
       * @see the Image.proto file
       */
      let flex
      if (!Number.isNaN(Number(containerWidth))) {
        flex = `${element.scale ?? 1} 1 ${validateWidth(containerWidth)}px`
      } else {
        flex = `${element.scale ?? 1} 1 0%`
      }

      return {
        width: containerWidth,
        flex: flex,
      }
    }

    const width = getWidth(useContainerWidth, commandWidth, containerWidth)
    const flex = getFlex(
      useContainerWidth,
      commandWidth,
      commandHeight,
      containerWidth,
      direction,
      element?.scale
    )
    const height = getHeight(commandHeight)
    const verticalScroll = getVerticalScroll(commandHeight)
    const styles: UseLayoutStylesShape = {
      width,
      height,
      maxWidth: "100%",
      maxHeight: "100%",
      flex,
      verticalScroll,
    }

    if (String(commandHeight) === "stretch") {
      styles.alignSelf = "stretch"
    }

    return styles
  }, [useContainerWidth, commandWidth, containerWidth, element])

  return layoutStyles
}
