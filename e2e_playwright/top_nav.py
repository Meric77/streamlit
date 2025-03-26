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

# Define page functions


def page_home():
    st.title("Home")
    st.write(
        "This is the home page. And I am going to make this text very long so that it overflows the page."
    )
    # Repeated content for demonstration
    for _ in range(8):
        st.title("Home")
        st.write("This is the home page.")


def page_about():
    st.title("About")
    st.write("This is the about page.")


def page_contact():
    st.title("Contact")
    st.write("This is the contact page.")
    st.tabs(["Tab 1", "Tab 2", "Tab 3"])


def page_services():
    st.title("Services")
    st.write("Our services page.")


def page_products():
    st.title("Products")
    st.write("Browse our products.")


def page_blog():
    st.title("Blog")
    st.write("Latest articles and updates.")


def page_faq():
    st.title("FAQ")
    st.write("Frequently asked questions.")


def page_team():
    st.title("Team")
    st.write("Meet our team members.")


def page_portfolio():
    st.title("Portfolio")
    st.write("View our past work.")


def page_pricing():
    st.title("Pricing")
    st.write("Our pricing plans.")


def page_testimonials():
    st.title("Testimonials")
    st.write("What our clients say.")


def page_support():
    st.title("Support")
    st.write("Get help and support.")


# Create pages using the defined functions
home = StreamlitPage(page_home, title="Home", icon="🏠", default=True)
about = StreamlitPage(page_about, title="About", icon="ℹ️")
contact = StreamlitPage(page_contact, title="Contact", icon="✉️")
services = StreamlitPage(page_services, title="Services", icon="🔧")
products = StreamlitPage(page_products, title="Products", icon="🛒")
blog = StreamlitPage(page_blog, title="Blog", icon="📝")
faq = StreamlitPage(page_faq, title="FAQ", icon="❓")
team = StreamlitPage(page_team, title="Team", icon="👥")
portfolio = StreamlitPage(page_portfolio, title="Portfolio", icon="🖼️")
pricing = StreamlitPage(page_pricing, title="Pricing", icon="💰")
testimonials = StreamlitPage(page_testimonials, title="Testimonials", icon="💬")
support = StreamlitPage(page_support, title="Support", icon="🆘")

# Set up navigation and logos
current_page = st.navigation(
    [
        home,
        about,
        contact,
        services,
        products,
        blog,
        faq,
        team,
        portfolio,
        pricing,
        testimonials,
        support,
    ],
    position="top",
)

# with sections
# current_page = st.navigation(
#     {
#         "Section 1": [home, about],
#         "Section 2": [services, products],
#         "Section 3": [blog, faq],
#         "Section 4": [
#             team,
#             portfolio,
#         ],
#         "Section 5": [
#             support,
#             pricing,
#         ],
#         "Section 6": [testimonials],
#     },
#     position="top",
# )


st.logo("logo.jpg", size="large")
st.sidebar.image("logo.jpg", width=100)

# Run the current page
current_page.run()
