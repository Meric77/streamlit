import sqlite3
import datetime
import calendar
from datetime import date, timedelta


class EggCRM:
    def __init__(self, db_name="egg_crm.db"):
        """Initialize the CRM with database connection"""
        self.conn = sqlite3.connect(db_name)
        self.cursor = self.conn.cursor()
        self.setup_database()

    def setup_database(self):
        """Create database tables if they don't exist"""
        # Create egg types table
        self.cursor.execute('''
        CREATE TABLE IF NOT EXISTS egg_types (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            price_per_unit REAL NOT NULL
        )
        ''')

        # Create members table
        self.cursor.execute('''
        CREATE TABLE IF NOT EXISTS members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            subscription_type TEXT NOT NULL,
            egg_type_id INTEGER NOT NULL,
            delivery_day TEXT NOT NULL,
            delivery_time TEXT NOT NULL,
            phone_number TEXT NOT NULL,
            subscription_start_date TEXT NOT NULL,
            subscription_end_date TEXT NOT NULL,
            FOREIGN KEY (egg_type_id) REFERENCES egg_types (id)
        )
        ''')

        # Create deliveries table
        self.cursor.execute('''
        CREATE TABLE IF NOT EXISTS deliveries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            member_id INTEGER NOT NULL,
            delivery_date TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            status TEXT DEFAULT 'pending',
            FOREIGN KEY (member_id) REFERENCES members (id)
        )
        ''')

        self.conn.commit()

    # Egg Type Management
    def add_egg_type(self, name, price_per_unit):
        """Add a new egg type to the database"""
        try:
            self.cursor.execute(
                "INSERT INTO egg_types (name, price_per_unit) VALUES (?, ?)",
                (name, price_per_unit)
            )
            self.conn.commit()
            return True
        except sqlite3.IntegrityError:
            return False

    def get_egg_types(self):
        """Get all egg types"""
        self.cursor.execute("SELECT id, name, price_per_unit FROM egg_types")
        return self.cursor.fetchall()

    def update_egg_type(self, egg_id, name=None, price_per_unit=None):
        """Update an egg type"""
        if name:
            self.cursor.execute("UPDATE egg_types SET name = ? WHERE id = ?", (name, egg_id))
        if price_per_unit is not None:
            self.cursor.execute("UPDATE egg_types SET price_per_unit = ? WHERE id = ?", (price_per_unit, egg_id))
        self.conn.commit()

    def delete_egg_type(self, egg_id):
        """Delete an egg type"""
        # Check if egg type is being used by any member
        self.cursor.execute("SELECT COUNT(*) FROM members WHERE egg_type_id = ?", (egg_id,))
        count = self.cursor.fetchone()[0]
        if count > 0:
            return False

        self.cursor.execute("DELETE FROM egg_types WHERE id = ?", (egg_id,))
        self.conn.commit()
        return True

    # Member Management
    def add_member(self, name, subscription_type, egg_type_id, delivery_day,
                   delivery_time, phone_number):
        """Add a new member with subscription"""
        # Calculate subscription dates (1 year from today)
        start_date = date.today().isoformat()
        end_date = (date.today() + timedelta(days=365)).isoformat()

        self.cursor.execute('''
        INSERT INTO members (
            name, subscription_type, egg_type_id, delivery_day, 
            delivery_time, phone_number, subscription_start_date, subscription_end_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (name, subscription_type, egg_type_id, delivery_day,
              delivery_time, phone_number, start_date, end_date))

        member_id = self.cursor.lastrowid
        self.conn.commit()

        # Generate delivery schedule
        self.generate_delivery_schedule(member_id)

        return member_id

    def get_members(self):
        """Get all members with their egg type info"""
        self.cursor.execute('''
        SELECT m.id, m.name, m.subscription_type, e.name, m.delivery_day, 
               m.delivery_time, m.phone_number, m.subscription_start_date, m.subscription_end_date
        FROM members m
        JOIN egg_types e ON m.egg_type_id = e.id
        ''')
        return self.cursor.fetchall()

    def get_member(self, member_id):
        """Get a specific member's details"""
        self.cursor.execute('''
        SELECT m.id, m.name, m.subscription_type, e.name, m.delivery_day, 
               m.delivery_time, m.phone_number, m.subscription_start_date, m.subscription_end_date,
               e.id, e.price_per_unit
        FROM members m
        JOIN egg_types e ON m.egg_type_id = e.id
        WHERE m.id = ?
        ''', (member_id,))
        return self.cursor.fetchone()

    def update_member(self, member_id, name=None, subscription_type=None,
                      egg_type_id=None, delivery_day=None, delivery_time=None,
                      phone_number=None):
        """Update a member's information"""
        # Get current member info to check if scheduling needs to be updated
        current = self.get_member(member_id)

        if name:
            self.cursor.execute("UPDATE members SET name = ? WHERE id = ?", (name, member_id))
        if subscription_type:
            self.cursor.execute("UPDATE members SET subscription_type = ? WHERE id = ?", (subscription_type, member_id))
        if egg_type_id:
            self.cursor.execute("UPDATE members SET egg_type_id = ? WHERE id = ?", (egg_type_id, member_id))
        if delivery_day:
            self.cursor.execute("UPDATE members SET delivery_day = ? WHERE id = ?", (delivery_day, member_id))
        if delivery_time:
            self.cursor.execute("UPDATE members SET delivery_time = ? WHERE id = ?", (delivery_time, member_id))
        if phone_number:
            self.cursor.execute("UPDATE members SET phone_number = ? WHERE id = ?", (phone_number, member_id))

        self.conn.commit()

        # If subscription type, delivery day, or egg type changed, update future deliveries
        if subscription_type or delivery_day or egg_type_id:
            # Delete future deliveries
            today = date.today().isoformat()
            self.cursor.execute(
                "DELETE FROM deliveries WHERE member_id = ? AND delivery_date >= ?",
                (member_id, today)
            )
            self.conn.commit()

            # Regenerate delivery schedule
            self.generate_delivery_schedule(member_id)

    def delete_member(self, member_id):
        """Delete a member and their deliveries"""
        # First delete all related deliveries
        self.cursor.execute("DELETE FROM deliveries WHERE member_id = ?", (member_id,))

        # Then delete the member
        self.cursor.execute("DELETE FROM members WHERE id = ?", (member_id,))
        self.conn.commit()

    # Delivery Management
    def generate_delivery_schedule(self, member_id):
        """Generate delivery schedule for a member"""
        member = self.get_member(member_id)
        if not member:
            return False

        # Parse member data
        _, _, subscription_type, _, delivery_day, _, _, start_date, end_date, _, _ = member

        start = datetime.date.fromisoformat(start_date)
        end = datetime.date.fromisoformat(end_date)

        # Set the quantity based on subscription type
        # Assuming weekly subscription is 1 box (30 eggs) and monthly is 4 boxes
        quantity = 30  # 1 box of 30 eggs

        # Generate dates based on subscription type
        current_date = start
        while current_date <= end:
            # Check if this is the right day of week for weekly subscription
            # or the right day of month for monthly subscription
            should_deliver = False

            if subscription_type == "Haftalık" and calendar.day_name[current_date.weekday()] == delivery_day:
                should_deliver = True
            elif subscription_type == "Aylık" and str(current_date.day) == delivery_day:
                should_deliver = True

            if should_deliver:
                self.cursor.execute(
                    "INSERT INTO deliveries (member_id, delivery_date, quantity, status) VALUES (?, ?, ?, 'pending')",
                    (member_id, current_date.isoformat(), quantity)
                )

            current_date += timedelta(days=1)

        self.conn.commit()
        return True

    def get_today_deliveries(self):
        """Get all deliveries scheduled for today"""
        today = date.today().isoformat()
        self.cursor.execute('''
        SELECT d.id, m.name, m.phone_number, e.name, d.quantity, d.status, m.delivery_time
        FROM deliveries d
        JOIN members m ON d.member_id = m.id
        JOIN egg_types e ON m.egg_type_id = e.id
        WHERE d.delivery_date = ?
        ''', (today,))
        return self.cursor.fetchall()

    def update_delivery_status(self, delivery_id, status):
        """Update the status of a delivery"""
        self.cursor.execute(
            "UPDATE deliveries SET status = ? WHERE id = ?",
            (status, delivery_id)
        )
        self.conn.commit()

    # Statistics and Reporting
    def get_monthly_revenue(self, year=None, month=None):
        """Calculate monthly revenue based on deliveries"""
        if year is None or month is None:
            today = date.today()
            year = today.year
            month = today.month

        # Get first and last day of the month
        first_day = date(year, month, 1).isoformat()

        # Last day calculation
        if month == 12:
            last_day = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            last_day = date(year, month + 1, 1) - timedelta(days=1)

        last_day = last_day.isoformat()

        self.cursor.execute('''
        SELECT SUM(d.quantity * e.price_per_unit)
        FROM deliveries d
        JOIN members m ON d.member_id = m.id
        JOIN egg_types e ON m.egg_type_id = e.id
        WHERE d.delivery_date BETWEEN ? AND ?
          AND d.status = 'completed'
        ''', (first_day, last_day))

        result = self.cursor.fetchone()[0]
        return result if result else 0

    def get_daily_revenue(self, specific_date=None):
        """Calculate daily revenue based on deliveries"""
        if specific_date is None:
            specific_date = date.today().isoformat()

        self.cursor.execute('''
        SELECT SUM(d.quantity * e.price_per_unit)
        FROM deliveries d
        JOIN members m ON d.member_id = m.id
        JOIN egg_types e ON m.egg_type_id = e.id
        WHERE d.delivery_date = ?
          AND d.status = 'completed'
        ''', (specific_date,))

        result = self.cursor.fetchone()[0]
        return result if result else 0

    def get_total_member_count(self):
        """Get the total number of members"""
        self.cursor.execute("SELECT COUNT(*) FROM members")
        return self.cursor.fetchone()[0]

    def close(self):
        """Close the database connection"""
        self.conn.commit()
        self.conn.close()


# Streamlit UI Code
import streamlit as st
import pandas as pd
import plotly.express as px
from datetime import datetime


def main():
    st.set_page_config(page_title="Gezen Tavuk Yumurtası Satış CRM", layout="wide")

    # Initialize CRM
    crm = EggCRM()

    # Sidebar for navigation
    st.sidebar.title("Gezen Tavuk CRM")
    page = st.sidebar.selectbox(
        "Seçim Yapın",
        ["Ana Sayfa", "Üyelik Ekle", "Yumurta Türü Ekle", "Üyeler", "Yumurtalar", "Üye Düzenle", "Yumurta Düzenle"]
    )

    # Page content
    if page == "Ana Sayfa":
        show_homepage(crm)
    elif page == "Üyelik Ekle":
        add_member_page(crm)
    elif page == "Yumurta Türü Ekle":
        add_egg_type_page(crm)
    elif page == "Üyeler":
        show_members_page(crm)
    elif page == "Yumurtalar":
        show_egg_types_page(crm)
    elif page == "Üye Düzenle":
        edit_member_page(crm)
    elif page == "Yumurta Düzenle":
        edit_egg_type_page(crm)

    # Clean up
    crm.close()


def show_homepage(crm):
    st.title("Gezen Tavuk Yumurtası Satış CRM")

    # Layout with columns
    col1, col2, col3 = st.columns(3)

    # Total member count
    with col1:
        st.metric("Toplam Üye Sayısı", crm.get_total_member_count())

    # Daily revenue
    with col2:
        daily_revenue = crm.get_daily_revenue()
        st.metric("Günlük Kazanç", f"₺{daily_revenue:.2f}")

    # Monthly revenue
    with col3:
        monthly_revenue = crm.get_monthly_revenue()
        st.metric("Aylık Kazanç", f"₺{monthly_revenue:.2f}")

    st.subheader("Bugünkü Teslimatlar")

    deliveries = crm.get_today_deliveries()
    if deliveries:
        df = pd.DataFrame(deliveries, columns=[
            "ID", "Üye Adı", "Telefon", "Yumurta Türü",
            "Miktar", "Durum", "Teslimat Saati"
        ])

        # Add a status update button for each delivery
        def update_status(delivery_id, new_status):
            crm.update_delivery_status(delivery_id, new_status)
            st.experimental_rerun()

        # Use Streamlit's data editor for interactive table
        st.dataframe(df)

        # Allow status updates for individual deliveries
        st.subheader("Teslimat Durumu Güncelle")
        update_col1, update_col2, update_col3 = st.columns(3)

        with update_col1:
            delivery_id = st.selectbox("Teslimat ID", df["ID"].tolist())

        with update_col2:
            new_status = st.selectbox("Yeni Durum", ["pending", "completed", "cancelled"])

        with update_col3:
            if st.button("Güncelle"):
                crm.update_delivery_status(delivery_id, new_status)
                st.success(f"Teslimat #{delivery_id} durumu {new_status} olarak güncellendi.")
                st.experimental_rerun()
    else:
        st.info("Bugün için planlanmış teslimat yok.")


def add_member_page(crm):
    st.title("Yeni Üyelik Ekle")

    # Get egg types for the dropdown
    egg_types = crm.get_egg_types()
    egg_type_options = {f"{name} (₺{price}/adet)": id for id, name, price in egg_types}

    if not egg_types:
        st.warning("Üyelik eklemek için önce yumurta türü eklemelisiniz.")
        return

    # Set up form
    with st.form("member_form"):
        name = st.text_input("Üye Adı")
        subscription_type = st.selectbox("Abonelik Türü", ["Haftalık", "Aylık"])

        # Dynamic delivery day options based on subscription type
        if subscription_type == "Haftalık":
            delivery_day_options = [
                "Monday", "Tuesday", "Wednesday",
                "Thursday", "Friday", "Saturday", "Sunday"
            ]
            delivery_day_label = "Teslimat Günü (Haftanın Günü)"
        else:  # Monthly
            delivery_day_options = [str(i) for i in range(1, 29)]  # Avoid month end issues
            delivery_day_label = "Teslimat Günü (Ayın Günü)"

        delivery_day = st.selectbox(delivery_day_label, delivery_day_options)
        delivery_time = st.time_input("Teslimat Saati", datetime.strptime("10:00", "%H:%M").time())
        egg_type = st.selectbox("Yumurta Türü", list(egg_type_options.keys()))
        phone_number = st.text_input("Telefon Numarası")

        submitted = st.form_submit_button("Üyelik Oluştur")

        if submitted:
            if not name or not phone_number:
                st.error("Lütfen tüm alanları doldurun.")
            else:
                # Extract egg type ID from the selection
                egg_type_id = egg_type_options[egg_type]

                # Format delivery time as string
                delivery_time_str = delivery_time.strftime("%H:%M")

                # Add the member
                member_id = crm.add_member(
                    name, subscription_type, egg_type_id,
                    delivery_day, delivery_time_str, phone_number
                )

                if member_id:
                    st.success(f"Üyelik başarıyla oluşturuldu! Üye ID: {member_id}")
                else:
                    st.error("Üyelik oluşturulurken bir hata oluştu.")


def add_egg_type_page(crm):
    st.title("Yeni Yumurta Türü Ekle")

    with st.form("egg_type_form"):
        name = st.text_input("Yumurta Türü Adı")
        price = st.number_input("Adet Fiyatı (₺)", min_value=0.0, format="%.2f")

        submitted = st.form_submit_button("Ekle")

        if submitted:
            if not name or price <= 0:
                st.error("Lütfen geçerli bir isim ve fiyat girin.")
            else:
                success = crm.add_egg_type(name, price)
                if success:
                    st.success(f"{name} yumurta türü başarıyla eklendi.")
                else:
                    st.error("Bu isimde bir yumurta türü zaten var.")


def show_members_page(crm):
    st.title("Üyeler")

    members = crm.get_members()

    if members:
        df = pd.DataFrame(members, columns=[
            "ID", "İsim", "Abonelik Türü", "Yumurta Türü",
            "Teslimat Günü", "Teslimat Saati", "Telefon",
            "Başlangıç Tarihi", "Bitiş Tarihi"
        ])

        st.dataframe(df)

        # Allow deleting a member
        st.subheader("Üye Sil")
        col1, col2 = st.columns(2)

        with col1:
            member_id = st.selectbox("Silinecek Üye", df["ID"].tolist())

        with col2:
            if st.button("Üye Sil"):
                if st.checkbox("Bu işlemi yapmak istediğinize emin misiniz?"):
                    crm.delete_member(member_id)
                    st.success(f"Üye #{member_id} silindi.")
                    st.experimental_rerun()
    else:
        st.info("Henüz kayıtlı üye yok.")


def show_egg_types_page(crm):
    st.title("Yumurta Türleri")

    egg_types = crm.get_egg_types()

    if egg_types:
        df = pd.DataFrame(egg_types, columns=["ID", "Tür Adı", "Adet Fiyatı (₺)"])

        st.dataframe(df)

        # Visualize prices with a chart
        fig = px.bar(df, x="Tür Adı", y="Adet Fiyatı (₺)", title="Yumurta Türlerine Göre Fiyatlar")
        st.plotly_chart(fig)
    else:
        st.info("Henüz kayıtlı yumurta türü yok.")


def edit_member_page(crm):
    st.title("Üye Düzenle")

    members = crm.get_members()

    if not members:
        st.info("Düzenlenecek üye bulunamadı.")
        return

    # Create a selection dict with name and id
    member_options = {f"{id} - {name}": id for id, name, *_ in members}

    selected_member = st.selectbox(
        "Düzenlenecek Üye",
        list(member_options.keys())
    )

    # Get selected member id
    member_id = member_options[selected_member]

    # Get member details
    member = crm.get_member(member_id)

    if member:
        m_id, m_name, m_subscription_type, m_egg_type, m_delivery_day, \
            m_delivery_time, m_phone, m_start_date, m_end_date, m_egg_type_id, _ = member

        # Get egg types for dropdown
        egg_types = crm.get_egg_types()
        egg_type_options = {f"{name} (₺{price}/adet)": id for id, name, price in egg_types}

        st.subheader(f"Üye Bilgileri: {m_name}")

        with st.form("edit_member_form"):
            name = st.text_input("Üye Adı", value=m_name)
            subscription_type = st.selectbox(
                "Abonelik Türü",
                ["Haftalık", "Aylık"],
                index=0 if m_subscription_type == "Haftalık" else 1
            )

            # Dynamic delivery day options based on subscription type
            if subscription_type == "Haftalık":
                delivery_day_options = [
                    "Monday", "Tuesday", "Wednesday",
                    "Thursday", "Friday", "Saturday", "Sunday"
                ]
                try:
                    day_index = delivery_day_options.index(m_delivery_day)
                except ValueError:
                    day_index = 0

                delivery_day_label = "Teslimat Günü (Haftanın Günü)"
            else:  # Monthly
                delivery_day_options = [str(i) for i in range(1, 29)]
                try:
                    day_index = delivery_day_options.index(m_delivery_day)
                except ValueError:
                    day_index = 0

                delivery_day_label = "Teslimat Günü (Ayın Günü)"

            delivery_day = st.selectbox(delivery_day_label, delivery_day_options, index=day_index)

            # Parse time string to time object
            try:
                time_obj = datetime.strptime(m_delivery_time, "%H:%M").time()
            except ValueError:
                time_obj = datetime.strptime("10:00", "%H:%M").time()

            delivery_time = st.time_input("Teslimat Saati", time_obj)

            # Find current egg type in options
            current_egg_type = None
            for option, option_id in egg_type_options.items():
                if option_id == m_egg_type_id:
                    current_egg_type = option
                    break

            egg_type = st.selectbox(
                "Yumurta Türü",
                list(egg_type_options.keys()),
                index=list(egg_type_options.keys()).index(current_egg_type) if current_egg_type else 0
            )

            phone_number = st.text_input("Telefon Numarası", value=m_phone)

            submitted = st.form_submit_button("Güncelle")

            if submitted:
                if not name or not phone_number:
                    st.error("Lütfen tüm alanları doldurun.")
                else:
                    # Extract egg type ID from the selection
                    egg_type_id = egg_type_options[egg_type]

                    # Format delivery time as string
                    delivery_time_str = delivery_time.strftime("%H:%M")

                    # Update the member
                    crm.update_member(
                        member_id, name, subscription_type, egg_type_id,
                        delivery_day, delivery_time_str, phone_number
                    )

                    st.success(f"Üye #{member_id} başarıyla güncellendi.")
    else:
        st.error("Üye bilgileri alınamadı.")


def edit_egg_type_page(crm):
    st.title("Yumurta Türü Düzenle")

    egg_types = crm.get_egg_types()

    if not egg_types:
        st.info("Düzenlenecek yumurta türü bulunamadı.")
        return

    # Create a selection dict with name and id
    egg_options = {f"{id} - {name}": id for id, name, _ in egg_types}

    selected_egg = st.selectbox(
        "Düzenlenecek Yumurta Türü",
        list(egg_options.keys())
    )

    # Get selected egg id
    egg_id = egg_options[selected_egg]

    # Find the egg type details
    selected_egg_data = None
    for e_id, name, price in egg_types:
        if e_id == egg_id:
            selected_egg_data = (e_id, name, price)
            break

    if selected_egg_data:
        e_id, e_name, e_price = selected_egg_data

        st.subheader(f"Yumurta Türü: {e_name}")

        with st.form("edit_egg_form"):
            name = st.text_input("Yumurta Türü Adı", value=e_name)
            price = st.number_input("Adet Fiyatı (₺)", min_value=0.0, value=e_price, format="%.2f")

            col1, col2 = st.columns(2)

            with col1:
                update = st.form_submit_button("Güncelle")

            with col2:
                delete = st.form_submit_button("Sil")

            if update:
                if not name or price <= 0:
                    st.error("Lütfen geçerli bir isim ve fiyat girin.")
                else:
                    crm.update_egg_type(egg_id, name, price)
                    st.success(f"Yumurta türü #{egg_id} başarıyla güncellendi.")
                    st.experimental_rerun()

            if delete:
                success = crm.delete_egg_type(egg_id)
                if success:
                    st.success(f"Yumurta türü #{egg_id} silindi.")
                    st.experimental_rerun()
                else:
                    st.error("Bu yumurta türü bir abonelikle ilişkili olduğu için silinemiyor.")


if __name__ == "__main__":
    main()