import os
import shutil
import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from tkcalendar import DateEntry
import mysql.connector

# --- CONFIGURATION (येथे तुमचा MySQL पासवर्ड टाका) ---
DB_CONFIG = {
    "host": "localhost",
    "user": "root",        # <--- येथे 'root' करा
    "password": "root",  # <--- जर पासवर्ड nikhil ठेवला असेल तर तोच राहू द्या
    "database": "ToolRoomDB"
}

# --- DATABASE SETUP ---
def init_db():
    try:
        conn = mysql.connector.connect(
            host=DB_CONFIG["host"],
            user=DB_CONFIG["user"],
            password=DB_CONFIG["password"]
        )
        cur = conn.cursor()
        cur.execute(f"CREATE DATABASE IF NOT EXISTS {DB_CONFIG['database']}")
        cur.execute(f"USE {DB_CONFIG['database']}")

        cur.execute("""
            CREATE TABLE IF NOT EXISTS customers (
                customer_id INT AUTO_INCREMENT PRIMARY KEY,
                customer_name VARCHAR(150),
                contact_number VARCHAR(20),
                city VARCHAR(100),
                address TEXT,
                order_date DATE,
                total_amount DECIMAL(10,2) DEFAULT 0.00,
                advance_amount DECIMAL(10,2) DEFAULT 0.00,
                balance_amount DECIMAL(10,2) DEFAULT 0.00,
                job_status VARCHAR(50) DEFAULT 'Pending',
                remarks TEXT
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS gear_details (
                gear_id INT AUTO_INCREMENT PRIMARY KEY,
                customer_id INT,
                qty INT,
                od VARCHAR(50),
                nt VARCHAR(50),
                model VARCHAR(100),
                angle VARCHAR(50),
                root VARCHAR(50),
                thickness VARCHAR(50),
                length VARCHAR(50),
                bore_keyway VARCHAR(100),
                material_grade VARCHAR(100),
                hardness VARCHAR(100),
                photo_paths TEXT,
                drawing_paths TEXT,
                FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
            )
        """)
        conn.commit()
        conn.close()
    except Exception as e:
        messagebox.showerror("Database Error", f"MySQL Connection Error: {e}")

def get_connection():
    return mysql.connector.connect(**DB_CONFIG)

# --- 1. NEW CUSTOMER FORM ---
class NewCustomerWindow(tk.Toplevel):
    def __init__(self, parent):
        super().__init__(parent)
        self.title("New Customer / Job Card Entry")
        self.geometry("900x750")
        
        self.photo_files = []
        self.drawing_files = []

        # Scrollable Frame
        canvas = tk.Canvas(self)
        scrollbar = ttk.Scrollbar(self, orient="vertical", command=canvas.yview)
        self.scrollable_frame = ttk.Frame(canvas, padding=15)

        self.scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        canvas.create_window((0, 0), window=self.scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)

        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")

        self.build_ui()

    def build_ui(self):
        # 1. Customer Details
        lbl_f1 = ttk.LabelFrame(self.scrollable_frame, text=" 1. Customer Details ", padding=10)
        lbl_f1.pack(fill="x", pady=5)

        ttk.Label(lbl_f1, text="Customer Name:*").grid(row=0, column=0, sticky="w", pady=3)
        self.txt_name = ttk.Entry(lbl_f1, width=30)
        self.txt_name.grid(row=0, column=1, pady=3, padx=5)

        ttk.Label(lbl_f1, text="Contact No:").grid(row=0, column=2, sticky="w", pady=3)
        self.txt_contact = ttk.Entry(lbl_f1, width=30)
        self.txt_contact.grid(row=0, column=3, pady=3, padx=5)

        ttk.Label(lbl_f1, text="City:").grid(row=1, column=0, sticky="w", pady=3)
        self.txt_city = ttk.Entry(lbl_f1, width=30)
        self.txt_city.grid(row=1, column=1, pady=3, padx=5)

        ttk.Label(lbl_f1, text="Order Date:").grid(row=1, column=2, sticky="w", pady=3)
        self.dtp_date = DateEntry(lbl_f1, width=27, background='darkblue', foreground='white', date_pattern='yyyy-mm-dd')
        self.dtp_date.grid(row=1, column=3, pady=3, padx=5)

        ttk.Label(lbl_f1, text="Address:").grid(row=2, column=0, sticky="w", pady=3)
        self.txt_address = ttk.Entry(lbl_f1, width=70)
        self.txt_address.grid(row=2, column=1, columnspan=3, pady=3, padx=5, sticky="w")

        # 2. Payment & Job Status
        lbl_f2 = ttk.LabelFrame(self.scrollable_frame, text=" 2. Status & Payment Details ", padding=10)
        lbl_f2.pack(fill="x", pady=5)

        ttk.Label(lbl_f2, text="Job Status:").grid(row=0, column=0, sticky="w")
        self.cmb_status = ttk.Combobox(lbl_f2, values=["Pending", "In-Production", "Completed", "Delivered"], state="readonly")
        self.cmb_status.set("Pending")
        self.cmb_status.grid(row=0, column=1, padx=5, pady=3)

        ttk.Label(lbl_f2, text="Total Amount (₹):").grid(row=0, column=2, sticky="w")
        self.txt_total = ttk.Entry(lbl_f2)
        self.txt_total.insert(0, "0.00")
        self.txt_total.grid(row=0, column=3, padx=5, pady=3)
        self.txt_total.bind("<KeyRelease>", self.calc_balance)

        ttk.Label(lbl_f2, text="Advance (₹):").grid(row=1, column=0, sticky="w")
        self.txt_advance = ttk.Entry(lbl_f2)
        self.txt_advance.insert(0, "0.00")
        self.txt_advance.grid(row=1, column=1, padx=5, pady=3)
        self.txt_advance.bind("<KeyRelease>", self.calc_balance)

        ttk.Label(lbl_f2, text="Balance (₹):").grid(row=1, column=2, sticky="w")
        self.txt_balance = ttk.Entry(lbl_f2)
        self.txt_balance.insert(0, "0.00")
        self.txt_balance.config(state="readonly")
        self.txt_balance.grid(row=1, column=3, padx=5, pady=3)

        # 3. Gear Details
        lbl_f3 = ttk.LabelFrame(self.scrollable_frame, text=" 3. Gear Specifications ", padding=10)
        lbl_f3.pack(fill="x", pady=5)

        fields = [
            ("Qty", "txt_qty"), ("OD", "txt_od"), ("NT", "txt_nt"), ("Model", "txt_model"),
            ("Angle", "txt_angle"), ("Root", "txt_root"), ("Thickness", "txt_thick"),
            ("Length", "txt_len"), ("Bore Keyway", "txt_bore"), ("Material Grade", "txt_grade"),
            ("Hardness", "txt_hard")
        ]

        self.gear_entries = {}
        r, c = 0, 0
        for label_text, var_name in fields:
            ttk.Label(lbl_f3, text=f"{label_text}:").grid(row=r, column=c, sticky="w", pady=3)
            ent = ttk.Entry(lbl_f3, width=20)
            ent.grid(row=r, column=c+1, padx=5, pady=3)
            self.gear_entries[var_name] = ent
            c += 2
            if c >= 4:
                c = 0
                r += 1

        # 4. Uploads & Remarks
        lbl_f4 = ttk.LabelFrame(self.scrollable_frame, text=" 4. Uploads & Remarks ", padding=10)
        lbl_f4.pack(fill="x", pady=5)

        ttk.Button(lbl_f4, text="📁 Upload Photos", command=self.upload_photos).grid(row=0, column=0, padx=5, pady=5)
        self.lbl_photos = ttk.Label(lbl_f4, text="0 photos selected", foreground="gray")
        self.lbl_photos.grid(row=0, column=1, padx=5)

        ttk.Button(lbl_f4, text="📁 Upload Drawings", command=self.upload_drawings).grid(row=0, column=2, padx=5, pady=5)
        self.lbl_drawings = ttk.Label(lbl_f4, text="0 drawings selected", foreground="gray")
        self.lbl_drawings.grid(row=0, column=3, padx=5)

        ttk.Label(lbl_f4, text="Remarks:").grid(row=1, column=0, sticky="nw", pady=5)
        self.txt_remarks = tk.Text(lbl_f4, height=3, width=70)
        self.txt_remarks.grid(row=1, column=1, columnspan=3, padx=5, pady=5)

        # Save Button
        btn_save = tk.Button(self.scrollable_frame, text="💾 Save Customer & Generate Job Card", 
                             font=("Arial", 12, "bold"), bg="#4CAF50", fg="white", height=2, command=self.save_data)
        btn_save.pack(fill="x", pady=15)

    def calc_balance(self, event=None):
        try:
            total = float(self.txt_total.get() or 0)
            adv = float(self.txt_advance.get() or 0)
            bal = total - adv
            self.txt_balance.config(state="normal")
            self.txt_balance.delete(0, tk.END)
            self.txt_balance.insert(0, f"{bal:.2f}")
            self.txt_balance.config(state="readonly")
        except ValueError:
            pass

    def upload_photos(self):
        files = filedialog.askopenfilenames(title="Select Photos", filetypes=[("Image Files", "*.jpg *.jpeg *.png *.bmp")])
        if files:
            self.photo_files = list(files)
            self.lbl_photos.config(text=f"{len(self.photo_files)} photo(s) selected", foreground="green")

    def upload_drawings(self):
        files = filedialog.askopenfilenames(title="Select Drawings", filetypes=[("Drawing / PDF", "*.jpg *.png *.pdf *.dwg")])
        if files:
            self.drawing_files = list(files)
            self.lbl_drawings.config(text=f"{len(self.drawing_files)} drawing(s) selected", foreground="green")

    def save_data(self):
        name = self.txt_name.get().strip()
        if not name:
            messagebox.showwarning("Validation Error", "Customer Name is required!")
            return

        try:
            conn = get_connection()
            cur = conn.cursor()

            # Insert Customer
            cur.execute("""
                INSERT INTO customers (customer_name, contact_number, city, address, order_date, total_amount, advance_amount, balance_amount, job_status, remarks)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                name, self.txt_contact.get(), self.txt_city.get(), self.txt_address.get(),
                self.dtp_date.get_date(), float(self.txt_total.get() or 0),
                float(self.txt_advance.get() or 0), float(self.txt_balance.get() or 0),
                self.cmb_status.get(), self.txt_remarks.get("1.0", tk.END).strip()
            ))
            cust_id = cur.lastrowid

            # Save Files locally
            base_dir = os.path.join(os.getcwd(), "App_Uploads", f"Customer_{cust_id}")
            photo_dir = os.path.join(base_dir, "Photos")
            draw_dir = os.path.join(base_dir, "Drawings")
            os.makedirs(photo_dir, exist_ok=True)
            os.makedirs(draw_dir, exist_ok=True)

            for p in self.photo_files:
                shutil.copy(p, photo_dir)
            for d in self.drawing_files:
                shutil.copy(d, draw_dir)

            # Insert Gear
            cur.execute("""
                INSERT INTO gear_details (customer_id, qty, od, nt, model, angle, root, thickness, length, bore_keyway, material_grade, hardness, photo_paths, drawing_paths)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                cust_id, int(self.gear_entries["txt_qty"].get() or 0),
                self.gear_entries["txt_od"].get(), self.gear_entries["txt_nt"].get(),
                self.gear_entries["txt_model"].get(), self.gear_entries["txt_angle"].get(),
                self.gear_entries["txt_root"].get(), self.gear_entries["txt_thick"].get(),
                self.gear_entries["txt_len"].get(), self.gear_entries["txt_bore"].get(),
                self.gear_entries["txt_grade"].get(), self.gear_entries["txt_hard"].get(),
                photo_dir, draw_dir
            ))

            conn.commit()
            conn.close()

            messagebox.showinfo("Success", f"Job Card Created Successfully!\nCustomer ID / Job No: {cust_id}")
            self.destroy()
        except Exception as e:
            messagebox.showerror("Error", f"Could not save data: {e}")

# --- 2. VIEW / SEARCH CUSTOMER WINDOW ---
class ViewCustomerWindow(tk.Toplevel):
    def __init__(self, parent):
        super().__init__(parent)
        self.title("View / Search Customers")
        self.geometry("950x550")

        top_frame = ttk.Frame(self, padding=10)
        top_frame.pack(fill="x")

        ttk.Label(top_frame, text="Search:").pack(side="left", padx=5)
        self.txt_search = ttk.Entry(top_frame, width=30)
        self.txt_search.pack(side="left", padx=5)

        ttk.Button(top_frame, text="🔍 Search", command=self.load_data).pack(side="left", padx=5)
        ttk.Button(top_frame, text="🔄 Reset All", command=self.reset_search).pack(side="left", padx=5)
        ttk.Button(top_frame, text="📂 Open Uploads Folder", command=self.open_uploads).pack(side="right", padx=5)

        # Table
        cols = ("ID", "Name", "Contact", "City", "Date", "Status", "Total", "Advance", "Balance")
        self.tree = ttk.Treeview(self, columns=cols, show="headings", height=18)
        for col in cols:
            self.tree.heading(col, text=col)
            self.tree.column(col, width=100, anchor="center")
        self.tree.column("Name", width=180, anchor="w")

        self.tree.pack(fill="both", expand=True, padx=10, pady=5)
        self.load_data()

    def load_data(self):
        for r in self.tree.get_children():
            self.tree.delete(r)

        search = f"%{self.txt_search.get().strip()}%"
        conn = get_connection()
        cur = conn.cursor()
        query = """
            SELECT customer_id, customer_name, contact_number, city, order_date, job_status, total_amount, advance_amount, balance_amount
            FROM customers
            WHERE customer_name LIKE %s OR contact_number LIKE %s OR customer_id LIKE %s
            ORDER BY customer_id DESC
        """
        cur.execute(query, (search, search, search))
        for row in cur.fetchall():
            self.tree.insert("", tk.END, values=row)
        conn.close()

    def reset_search(self):
        self.txt_search.delete(0, tk.END)
        self.load_data()

    def open_uploads(self):
        selected = self.tree.selection()
        if not selected:
            messagebox.showinfo("Select Row", "कृपया लिस्ट मधून एक कस्टमर सिलेक्ट करा.")
            return
        cust_id = self.tree.item(selected[0])['values'][0]
        path = os.path.join(os.getcwd(), "App_Uploads", f"Customer_{cust_id}")
        if os.path.exists(path):
            os.startfile(path)
        else:
            messagebox.showinfo("Not Found", "या कस्टमरसाठी कोणतेही फोटो/ड्रॉईंग उपलब्ध नाहीत.")

# --- 3. REPORTS WINDOW ---
class ReportsWindow(tk.Toplevel):
    def __init__(self, parent):
        super().__init__(parent)
        self.title("Date-wise Reports & Summary")
        self.geometry("900x500")

        filter_frame = ttk.Frame(self, padding=10)
        filter_frame.pack(fill="x")

        ttk.Label(filter_frame, text="From Date:").pack(side="left", padx=5)
        self.dtp_from = DateEntry(filter_frame, width=12, background='darkblue', foreground='white', date_pattern='yyyy-mm-dd')
        self.dtp_from.pack(side="left", padx=5)

        ttk.Label(filter_frame, text="To Date:").pack(side="left", padx=5)
        self.dtp_to = DateEntry(filter_frame, width=12, background='darkblue', foreground='white', date_pattern='yyyy-mm-dd')
        self.dtp_to.pack(side="left", padx=5)

        ttk.Button(filter_frame, text="📊 Filter Report", command=self.load_report).pack(side="left", padx=10)

        cols = ("ID", "Customer", "Date", "Status", "Total (₹)", "Advance (₹)", "Balance (₹)")
        self.tree = ttk.Treeview(self, columns=cols, show="headings", height=15)
        for col in cols:
            self.tree.heading(col, text=col)
            self.tree.column(col, width=110, anchor="center")
        self.tree.column("Customer", width=180, anchor="w")
        self.tree.pack(fill="both", expand=True, padx=10, pady=5)

        self.lbl_summary = ttk.Label(self, text="Total Revenue: ₹0.00 | Total Balance: ₹0.00", font=("Arial", 11, "bold"))
        self.lbl_summary.pack(pady=10)

    def load_report(self):
        for r in self.tree.get_children():
            self.tree.delete(r)

        f_date = self.dtp_from.get_date()
        t_date = self.dtp_to.get_date()

        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT customer_id, customer_name, order_date, job_status, total_amount, advance_amount, balance_amount
            FROM customers
            WHERE order_date BETWEEN %s AND %s
            ORDER BY order_date ASC
        """, (f_date, t_date))
        
        rows = cur.fetchall()
        tot_rev, tot_bal = 0.0, 0.0
        for r in rows:
            self.tree.insert("", tk.END, values=r)
            tot_rev += float(r[4] or 0)
            tot_bal += float(r[6] or 0)

        conn.close()
        self.lbl_summary.config(text=f"Total Revenue: ₹{tot_rev:,.2f}  |  Pending Balance: ₹{tot_bal:,.2f}")

# --- MAIN DASHBOARD ---
def main():
    init_db()

    root = tk.Tk()
    root.title("⚙️ Tool Room Management System")
    root.geometry("550x420")
    root.config(bg="#f8f9fa")
    root.resizable(False, False)

    tk.Label(root, text="⚙️ TOOL ROOM MANAGEMENT", font=("Arial", 16, "bold"), bg="#f8f9fa", fg="#333").pack(pady=30)

    btn_style = {"font": ("Arial", 12, "bold"), "width": 30, "height": 2, "relief": "groove"}

    tk.Button(root, text="➕  New Customer / Job Card", bg="#28a745", fg="white", 
              command=lambda: NewCustomerWindow(root), **btn_style).pack(pady=8)

    tk.Button(root, text="🔍  View / Search Customers", bg="#007bff", fg="white", 
              command=lambda: ViewCustomerWindow(root), **btn_style).pack(pady=8)

    tk.Button(root, text="📊  Reports & Summary", bg="#fd7e14", fg="white", 
              command=lambda: ReportsWindow(root), **btn_style).pack(pady=8)

    root.mainloop()

if __name__ == "__main__":
    main()