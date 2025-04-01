# Copyright (c) Streamlit Inc. (2018-2022) Snowflake Inc. (2022-2025)
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from __future__ import annotations

import os
import re
from pathlib import Path
from typing import TYPE_CHECKING, Any, cast

from streamlit.delta_generator_singletons import get_dg_singleton_instance
from streamlit.errors import StreamlitAPIException
from streamlit.proto.Html_pb2 import Html as HtmlProto
from streamlit.runtime.metrics_util import gather_metrics
from streamlit.string_util import clean_text
from streamlit.type_util import SupportsReprHtml, SupportsStr, has_callable_attr

if TYPE_CHECKING:
    from streamlit.delta_generator import DeltaGenerator


class HtmlMixin:
    @gather_metrics("html")
    def html(
        self,
        body: str | Path | SupportsStr | SupportsReprHtml,
    ) -> DeltaGenerator:
        """Insert HTML into your app.

        Adding custom HTML to your app impacts safety, styling, and
        maintainability. We sanitize HTML with `DOMPurify
        <https://github.com/cure53/DOMPurify>`_, but inserting HTML remains a
        developer risk. Passing untrusted code to ``st.html`` or dynamically
        loading external code can increase the risk of vulnerabilities in your
        app.

        ``st.html`` content is **not** iframed. Executing JavaScript is not
        supported at this time.

        Parameters
        ----------
        body : any
            The HTML code to insert. This can be one of the following:

            - A string of HTML code.
            - A path to a local file with HTML code. The path can be a ``str``
              or ``Path`` object. Paths can be absolute or relative to the
              working directory (where you execute ``streamlit run``).
            - Any object. If ``body`` is not a string or path, Streamlit will
              convert the object to a string. ``body._repr_html_()`` takes
              precedence over ``str(body)`` when available.

        Example
        -------
        >>> import streamlit as st
        >>>
        >>> st.html(
        ...     "<p><span style='text-decoration: line-through double red;'>Oops</span>!</p>"
        ... )

        .. output::
           https://doc-html.streamlit.app/
           height: 300px

        """
        html_proto = HtmlProto()

        # If body supports _repr_html_, use that.
        if has_callable_attr(body, "_repr_html_"):
            html_content = cast("SupportsReprHtml", body)._repr_html_()

        # Check if the body is a file path. May include filesystem lookup.
        elif isinstance(body, Path) or _is_file(body):
            file_path = str(body)
            with open(file_path, encoding="utf-8") as f:
                html_content = f.read()

            # If it's a CSS file, wrap the content in style tags
            if Path(file_path).suffix.lower() == ".css":
                html_content = f"<style>{html_content}</style>"

        # OK, let's just try converting to string and hope for the best.
        else:
            html_content = clean_text(cast("SupportsStr", body))

        if html_content == "":
            raise StreamlitAPIException("`st.html` content cannot be empty")
        else:
            # Extract style tags from the HTML, returning both the cleaned HTML and styles separately
            html_without_styles, styles = _extract_style_tags(html_content)

        returned_dg = self.dg
        if styles:
            # Send the styles to be rendered by the event container,
            # that way they don't take up space in the app content
            styles_proto = HtmlProto()
            styles_proto.body = styles
            returned_dg = self._event_dg._enqueue("html", styles_proto)

        if html_without_styles:
            # Set the non-style HTML as the body
            html_proto.body = html_without_styles
            returned_dg = self.dg._enqueue("html", html_proto)

        return returned_dg

    @property
    def dg(self) -> DeltaGenerator:
        """Get our DeltaGenerator."""
        return cast("DeltaGenerator", self)

    @property
    def _event_dg(self) -> DeltaGenerator:
        """Get the event delta generator."""
        return get_dg_singleton_instance().event_dg


def _extract_style_tags(html_content: str) -> tuple[str, str]:
    """Extract style tags and their contents from HTML, returning both the non-style HTML and styles."""
    # Pattern to match style tags and their contents
    style_pattern = r"<style[^>]*>.*?</style>"

    # Extract all style tags and their contents
    styles = "\n".join(re.findall(style_pattern, html_content, re.DOTALL))

    # Remove style tags and their contents from the HTML
    html_without_styles = re.sub(style_pattern, "", html_content, flags=re.DOTALL)

    return html_without_styles, styles


def _is_file(obj: Any) -> bool:
    """Checks if obj is a file, and doesn't throw if not.

    The "not throwing" part is important!
    """
    try:
        return os.path.isfile(obj)
    except TypeError:
        return False
