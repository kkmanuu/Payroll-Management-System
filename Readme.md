# Payroll Management System

The **Payroll Management System** is a web-based application designed to automate the process of managing employee salaries, attendance, deductions, and other payroll-related operations. This project is ideal for small to mid-sized organizations seeking a reliable payroll solution.

## 📌 Features

- Employee management (Add, Edit, Delete)
- Salary calculation and generation
- Allowances and deductions management
- Department and job role assignments
- User authentication and access control
- Dashboard with payroll statistics and summaries
- Printable payslips and reports

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, Bootstrap, JavaScript  
- **Backend:** Express.js  
- **Database:** MySQL (via XAMPP)  
- **Server:** Apache (via XAMPP)

## ⚙️ Installation & Setup

1. **Install XAMPP:**
   - Download and install [XAMPP](https://www.apachefriends.org/) on your system.
   - Start **Apache** and **MySQL** from the XAMPP control panel.

2. **Clone this repository:**
   ```bash
   git clone https://github.com/kkmanuu/Payroll-Management-System.git
3.  **Move the project:**
    ```bash
    Copy the project folder to your XAMPP htdocs directory:
    C:\xampp\htdocs\
    ```

4.  **Import the Database:**

   - Open phpMyAdmin via http://localhost/phpmyadmin

   - Create a new database (e.g., payroll_system)

   - Import the SQL file included in the repo (e.g., payroll.sql) to set up the database schema and sample data.


5. **Configure database connection:**

   - Open the db.php or config.php file (depending on your setup)
      Update the DB credentials:
       ```bash
      $host = 'localhost';
      $user = 'root';
      $pass = '';
      $db   = 'payroll_system';
      ```

6. **Run the Application:**

 - Visit http://localhost/Payroll-Management-System in your browser.


🧪 **Usage**

   - Admin Login: Access full features such as employee management, salary configuration, and reporting.

   - Employees: View payslips and personal information (if roles are implemented).

   - Generate and print payslips.

   - Filter and export reports for accounting.

   🤝 Contributing

    - Contributions are welcome! If you'd like to improve this project, feel free to fork the repo and submit a pull request.

📄 License
  - This project is open source and available under the MIT License.
