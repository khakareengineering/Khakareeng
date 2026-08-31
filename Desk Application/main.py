import os
import sqlite3
from kivy.app import App
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.gridlayout import GridLayout
from kivy.uix.scrollview import ScrollView
from kivy.uix.label import Label
from kivy.uix.textinput import TextInput
from kivy.uix.button import Button
from kivy.uix.popup import Popup

# --- SQLite OFFLINE DATABASE ---
def init_sqlite():
    conn = sqlite3.connect("toolroom_offline.db")
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS job_cards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT, contact TEXT, city TEXT, date TEXT,
            total REAL, advance REAL, balance REAL,
            qty TEXT, od TEXT, nt TEXT, model TEXT, angle TEXT,
            root TEXT, thickness TEXT, length TEXT, bore TEXT,
            grade TEXT, hardness TEXT, remarks TEXT
        )
    """)
    conn.commit()
    conn.close()

# --- MAIN APP UI ---
class ToolRoomMobileApp(App):
    def build(self):
        init_sqlite()
        self.title = "Tool Room Mobile"

        root = BoxLayout(orientation='vertical', padding=10, spacing=10)

        # Header
        root.add_widget(Label(text="⚙️ Tool Room Job Card", font_size='20sp', size_hint_y=None, height=40, bold=True))

        # Scrollable Form
        scroll = ScrollView(size_hint=(1, 1))
        layout = GridLayout(cols=2, spacing=8, size_hint_y=None)
        layout.bind(minimum_height=layout.setter('height'))

        self.inputs = {}
        fields = [
            ("Customer Name", "name"), ("Contact No", "contact"),
            ("City", "city"), ("Order Date (YYYY-MM-DD)", "date"),
            ("Total Amount (₹)", "total"), ("Advance Paid (₹)", "advance"),
            ("Qty", "qty"), ("OD", "od"), ("NT", "nt"),
            ("Model", "model"), ("Angle", "angle"), ("Root", "root"),
            ("Thickness", "thickness"), ("Length", "length"),
            ("Bore / Keyway", "bore"), ("Material Grade", "grade"),
            ("Hardness", "hardness"), ("Remarks", "remarks")
        ]

        for label_text, key in fields:
            layout.add_widget(Label(text=label_text, size_hint_y=None, height=35, halign="left"))
            inp = TextInput(multiline=False, size_hint_y=None, height=35)
            layout.add_widget(inp)
            self.inputs[key] = inp

        scroll.add_widget(layout)
        root.add_widget(scroll)

        # Save Button
        btn_save = Button(text="💾 Save Job Card (Offline)", size_hint_y=None, height=50, background_color=(0.15, 0.68, 0.37, 1))
        btn_save.bind(on_press=self.save_data)
        root.add_widget(btn_save)

        return root

    def save_data(self, instance):
        name = self.inputs['name'].text.strip()
        if not name:
            self.show_popup("Error", "Customer Name is required!")
            return

        try:
            total = float(self.inputs['total'].text or 0)
            adv = float(self.inputs['advance'].text or 0)
            bal = total - adv

            conn = sqlite3.connect("toolroom_offline.db")
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO job_cards (name, contact, city, date, total, advance, balance,
                                       qty, od, nt, model, angle, root, thickness, length,
                                       bore, grade, hardness, remarks)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                name, self.inputs['contact'].text, self.inputs['city'].text, self.inputs['date'].text,
                total, adv, bal, self.inputs['qty'].text, self.inputs['od'].text, self.inputs['nt'].text,
                self.inputs['model'].text, self.inputs['angle'].text, self.inputs['root'].text,
                self.inputs['thickness'].text, self.inputs['length'].text, self.inputs['bore'].text,
                self.inputs['grade'].text, self.inputs['hardness'].text, self.inputs['remarks'].text
            ))
            job_id = cur.lastrowid
            conn.commit()
            conn.close()

            self.show_popup("Success", f"Job Card #{job_id} Saved!\nBalance: ₹{bal:.2f}")
            self.clear_fields()
        except Exception as e:
            self.show_popup("Error", str(e))

    def clear_fields(self):
        for inp in self.inputs.values():
            inp.text = ""

    def show_popup(self, title, msg):
        popup = Popup(title=title, content=Label(text=msg), size_hint=(0.8, 0.4))
        popup.open()

if __name__ == '__main__':
    ToolRoomMobileApp().run()