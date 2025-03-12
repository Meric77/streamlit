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

import streamlit as st
from streamlit.navigation.page import StreamlitPage


# Define minimal page functions
def page_home():
    st.title("Home")
    st.write("This is the home page.")


def page_about():
    st.title("About")
    st.write("This is the about page.")


def page_contact():
    st.title("Contact")
    st.write("This is the contact page.")

    st.tabs(["Tab 1", "Tab 2", "Tab 3"])


# Create pages
home = StreamlitPage(page_home, title="Home", icon="🏠", default=True)
about = StreamlitPage(page_about, title="About", icon="ℹ️")
contact = StreamlitPage(page_contact, title="Contact", icon="✉️")

# Minimal test of top navigation
# current_page = st.navigation(
#     {"Section 1": [home], "Section 2": [about, contact]},
#     position="top",
#     expanded=True,
# )
current_page = st.navigation([home, about, contact], position="top")
st.logo("logo.jpg", size="large")


# Run the current page
current_page.run()
