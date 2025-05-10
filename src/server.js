const inquirer = require("inquirer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const db = require("./config/db");
require("dotenv").config();

try {
  const inquirerVersion = require("inquirer/package.json").version;
  console.log("Inquirer version:", inquirerVersion);
} catch (error) {
  console.log("Inquirer version check failed, but module is loaded.");
}

const hashPassword = async (password) => await bcrypt.hash(password, 10);

const logAudit = async (user_id, action, details) => {
  await db.query(
    "INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)",
    [user_id, action, JSON.stringify(details)]
  );
  console.log(`Audit log saved: ${action}`);
};

const startScreen = async () => {
  console.log("=== Welcome to Payroll Management System ===");
  const { action } = await inquirer.prompt({
    type: "list",
    name: "action",
    message: "Please choose an option:",
    choices: ["Sign Up", "Login", "Exit"],
  });

  switch (action) {
    case "Sign Up":
      return signUp();
    case "Login":
      return login();
    case "Exit":
      console.log("Goodbye!");
      process.exit(0);
  }
};

const signUp = async () => {
  console.log("=== Sign Up Form ===");

  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "name",
      message: "Full Name:",
      validate: (input) => (input.trim() ? true : "Name is required"),
    },
    {
      type: "input",
      name: "email",
      message: "Email Address:",
      validate: (input) => (input.includes("@") ? true : "Enter a valid email"),
    },
    {
      type: "password",
      name: "password",
      message: "Password:",
      validate: (input) =>
        input.length >= 6 ? true : "Password must be at least 6 characters",
    },
    {
      type: "input",
      name: "position",
      message: "Position (e.g., Field Worker):",
      validate: (input) => (input.trim() ? true : "Position is required"),
    },
    {
      type: "input",
      name: "department_name",
      message: "Department Name (e.g., Field Operations):",
      validate: (input) =>
        input.trim() ? true : "Department name is required",
    },
  ]);

  const { name, email, password, position, department_name } = answers;

  try {
    const [deptRows] = await db.query(
      "SELECT department_id FROM departments WHERE department_name = ?",
      [department_name]
    );
    let department_id;

    if (deptRows.length > 0) {
      department_id = deptRows[0].department_id;
    } else {
      const [result] = await db.query(
        "INSERT INTO departments (department_name) VALUES (?)",
        [department_name]
      );
      department_id = result.insertId;
      console.log(
        `New department "${department_name}" created with ID: ${department_id}`
      );
    }

    const hashedPassword = await hashPassword(password);
    await db.query(
      "INSERT INTO employees (employee_name, email_id, password, position, department_id) VALUES (?, ?, ?, ?, ?)",
      [name, email, hashedPassword, position, department_id]
    );
    console.log(
      "Sign up successful! You can now log in with your credentials."
    );
    return startScreen();
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      console.log(
        "Error: This email is already registered. Please use a different email."
      );
    } else {
      console.error("Error during sign up:", error.message);
    }
    return startScreen();
  }
};

const login = async () => {
  console.log("=== Login Form ===");
  const { email_id, password } = await inquirer.prompt([
    { type: "input", name: "email_id", message: "Email Address:" },
    { type: "password", name: "password", message: "Password:" },
  ]);

  try {
    const [rows] = await db.query(
      "SELECT * FROM employees WHERE email_id = ?",
      [email_id]
    );
    if (rows.length === 0) {
      console.log("User not found. Please try again or sign up.");
      return startScreen();
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Invalid credentials. Please try again.");
      return startScreen();
    }

    await logAudit(user.employee_id, "Login", { email_id });
    console.log("Login successful!");
    return mainMenu(user);
  } catch (error) {
    console.error("Login error:", error.message);
    return startScreen();
  }
};

const mainMenu = async (user) => {
  const { action } = await inquirer.prompt({
    type: "list",
    name: "action",
    message: `Welcome, ${user.employee_name}. Select an action:`,
    choices: [
      "Employee Management",
      "Department Management",
      "Leave Management",
      "Salary Management",
      "Record Attendance",
      "Generate Employee Report",
      "Generate Department Report",
      "Generate Leave Report",
      "Generate Salary Report",
      "Generate System User Report",
      "View Audit Logs",
      "Logout",
    ],
  });

  switch (action) {
    case "Employee Management":
      return employeeManagement(user);
    case "Department Management":
      return departmentManagement(user);
    case "Leave Management":
      return leaveManagement(user);
    case "Salary Management":
      return salaryManagement(user);
    case "Record Attendance":
      return recordAttendance(user);
    case "Generate Employee Report":
      return generateEmployeeReport(user);
    case "Generate Department Report":
      return generateDepartmentReport(user);
    case "Generate Leave Report":
      return generateLeaveReport(user);
    case "Generate Salary Report":
      return generateSalaryReport(user);
    case "Generate System User Report":
      return generateSystemUserReport(user);
    case "View Audit Logs":
      return viewAuditLogs(user);
    case "Logout":
      console.log("Logged out successfully!");
      return startScreen();
  }
};

// Updated Employee Management Function
const employeeManagement = async (user) => {
  const { action } = await inquirer.prompt({
    type: "list",
    name: "action",
    message: "Employee Management Options:",
    choices: ["Add Employee", "View Employees", "Back to Main Menu"],
  });

  if (action === "Back to Main Menu") return mainMenu(user);

  if (action === "Add Employee") {
    console.log("=== Add Employee Form ===");
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "name",
        message: "Employee Name:",
        validate: (input) => (input.trim() ? true : "Name is required"),
      },
      {
        type: "input",
        name: "email",
        message: "Email Address:",
        validate: (input) =>
          input.includes("@") ? true : "Enter a valid email",
      },
      {
        type: "password",
        name: "password",
        message: "Password:",
        validate: (input) =>
          input.length >= 6 ? true : "Password must be at least 6 characters",
      },
      {
        type: "input",
        name: "position",
        message: "Position:",
        validate: (input) => (input.trim() ? true : "Position is required"),
      },
      {
        type: "input",
        name: "department_name",
        message: "Department Name (e.g., Field Operations):",
        validate: (input) =>
          input.trim() ? true : "Department name is required",
      },
      {
        type: "number",
        name: "base_salary",
        message: "Base Salary (e.g., 50000):",
        validate: (input) =>
          input > 0 ? true : "Base salary must be a positive number",
        default: 0,
      },
      {
        type: "number",
        name: "deductions",
        message: "Deductions (e.g., 5000):",
        validate: (input) =>
          input >= 0 ? true : "Deductions cannot be negative",
        default: 0,
      },
      {
        type: "input",
        name: "period",
        message: "Salary Period (e.g., 2025-04):",
        validate: (input) =>
          /^\d{4}-\d{2}$/.test(input) ? true : "Enter period in YYYY-MM format",
        default: "2025-04",
      },
    ]);

    const {
      name,
      email,
      password,
      position,
      department_name,
      base_salary,
      deductions,
      period,
    } = answers;
    const net_salary = base_salary - deductions;

    try {
      const [deptRows] = await db.query(
        "SELECT department_id FROM departments WHERE department_name = ?",
        [department_name]
      );
      let department_id;

      if (deptRows.length > 0) {
        department_id = deptRows[0].department_id;
      } else {
        const [result] = await db.query(
          "INSERT INTO departments (department_name) VALUES (?)",
          [department_name]
        );
        department_id = result.insertId;
        console.log(
          `New department "${department_name}" created with ID: ${department_id}`
        );
      }

      const hashedPassword = await hashPassword(password);
      const [employeeResult] = await db.query(
        "INSERT INTO employees (employee_name, email_id, password, position, department_id) VALUES (?, ?, ?, ?, ?)",
        [name, email, hashedPassword, position, department_id]
      );
      const employee_id = employeeResult.insertId;

      await db.query(
        "INSERT INTO salaries (employee_id, base_salary, deductions, net_salary, period) VALUES (?, ?, ?, ?, ?)",
        [employee_id, base_salary, deductions, net_salary, period]
      );

      await logAudit(user.employee_id, "Add Employee", {
        name,
        email,
        department_name,
        base_salary,
        deductions,
        net_salary,
        period,
      });
      console.log("Employee and salary data saved to database!");
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        console.log(
          "Error: This email is already registered. Please use a different email."
        );
      } else {
        console.error("Error saving employee:", error.message);
      }
    }
  } else if (action === "View Employees") {
    try {
      const [rows] = await db.query(
        "SELECT e.employee_id, e.employee_name, e.position, d.department_name FROM employees e LEFT JOIN departments d ON e.department_id = d.department_id"
      );
      console.log("=== Employee List ===");
      rows.forEach((row) =>
        console.log(
          `ID: ${row.employee_id}, Name: ${row.employee_name}, Position: ${
            row.position
          }, Dept: ${row.department_name || "N/A"}`
        )
      );
    } catch (error) {
      console.error("Error viewing employees:", error.message);
    }
  }
  return employeeManagement(user);
};

const departmentManagement = async (user) => {
  const { action } = await inquirer.prompt({
    type: "list",
    name: "action",
    message: "Department Management Options:",
    choices: ["Add Department", "View Departments", "Back to Main Menu"],
  });

  if (action === "Back to Main Menu") return mainMenu(user);

  if (action === "Add Department") {
    console.log("=== Add Department Form ===");
    const { name } = await inquirer.prompt([
      { type: "input", name: "name", message: "Department Name:" },
    ]);

    try {
      await db.query("INSERT INTO departments (department_name) VALUES (?)", [
        name,
      ]);
      await logAudit(user.employee_id, "Add Department", { name });
      console.log("Department data saved to database!");
    } catch (error) {
      console.error("Error saving department:", error.message);
    }
  } else if (action === "View Departments") {
    try {
      const [rows] = await db.query("SELECT * FROM departments");
      console.log("=== Department List ===");
      rows.forEach((row) =>
        console.log(`ID: ${row.department_id}, Name: ${row.department_name}`)
      );
    } catch (error) {
      console.error("Error viewing departments:", error.message);
    }
  }
  return departmentManagement(user);
};

const leaveManagement = async (user) => {
  const { action } = await inquirer.prompt({
    type: "list",
    name: "action",
    message: "Leave Management Options:",
    choices: [
      "Request Leave",
      "Approve/Reject Leave",
      "View Leaves",
      "Back to Main Menu",
    ],
  });

  if (action === "Back to Main Menu") return mainMenu(user);

  if (action === "Request Leave") {
    console.log("=== Request Leave Form ===");
    const { employee_id, date, type } = await inquirer.prompt([
      { type: "number", name: "employee_id", message: "Employee ID:" },
      { type: "input", name: "date", message: "Leave Date (YYYY-MM-DD):" },
      {
        type: "input",
        name: "type",
        message: "Leave Type (e.g., Sick, Annual):",
      },
    ]);

    try {
      await db.query(
        "INSERT INTO leaves (employee_id, leave_date, leave_type) VALUES (?, ?, ?)",
        [employee_id, date, type]
      );
      await logAudit(user.employee_id, "Request Leave", {
        employee_id,
        date,
        type,
      });
      console.log("Leave data saved to database!");
    } catch (error) {
      console.error("Error saving leave:", error.message);
    }
  } else if (action === "Approve/Reject Leave") {
    console.log("=== Approve/Reject Leave Form ===");
    const { leave_id, status } = await inquirer.prompt([
      { type: "number", name: "leave_id", message: "Leave ID:" },
      {
        type: "list",
        name: "status",
        message: "Status:",
        choices: ["Approved", "Rejected"],
      },
    ]);

    try {
      await db.query("UPDATE leaves SET status = ? WHERE leave_id = ?", [
        status,
        leave_id,
      ]);
      await logAudit(user.employee_id, "Update Leave Status", {
        leave_id,
        status,
      });
      console.log("Leave status updated in database!");
    } catch (error) {
      console.error("Error updating leave:", error.message);
    }
  } else if (action === "View Leaves") {
    try {
      const [rows] = await db.query(
        "SELECT l.leave_id, e.employee_name, l.leave_date, l.leave_type, l.status FROM leaves l JOIN employees e ON l.employee_id = e.employee_id"
      );
      console.log("=== Leave List ===");
      rows.forEach((row) =>
        console.log(
          `ID: ${row.leave_id}, Name: ${row.employee_name}, Date: ${row.leave_date}, Type: ${row.leave_type}, Status: ${row.status}`
        )
      );
    } catch (error) {
      console.error("Error viewing leaves:", error.message);
    }
  }
  return leaveManagement(user);
};

const salaryManagement = async (user) => {
  const { action } = await inquirer.prompt({
    type: "list",
    name: "action",
    message: "Salary Management Options:",
    choices: [
      "Add Salary",
      "Calculate Payroll",
      "View Payslip",
      "Back to Main Menu",
    ],
  });

  if (action === "Back to Main Menu") return mainMenu(user);

  if (action === "Add Salary") {
    console.log("=== Add Salary Form ===");
    const answers = await inquirer.prompt([
      {
        type: "number",
        name: "employee_id",
        message: "Employee ID:",
        validate: (input) =>
          input > 0 ? true : "Employee ID must be a positive number",
      },
      {
        type: "number",
        name: "base_salary",
        message: "Base Salary (e.g., 50000):",
        validate: (input) =>
          input > 0 ? true : "Base salary must be a positive number",
        default: 0,
      },
      {
        type: "number",
        name: "deductions",
        message: "Deductions (e.g., 5000):",
        validate: (input) =>
          input >= 0 ? true : "Deductions cannot be negative",
        default: 0,
      },
      {
        type: "input",
        name: "period",
        message: "Period (e.g., 2025-04):",
        validate: (input) =>
          /^\d{4}-\d{2}$/.test(input) ? true : "Enter period in YYYY-MM format",
        default: "2025-04",
      },
    ]);

    const { employee_id, base_salary, deductions, period } = answers;
    const net_salary = base_salary - deductions;

    try {
      // Verify employee exists
      const [employeeRows] = await db.query(
        "SELECT employee_name FROM employees WHERE employee_id = ?",
        [employee_id]
      );
      if (employeeRows.length === 0) {
        console.log("Error: Employee ID not found.");
        return salaryManagement(user);
      }

      await db.query(
        "INSERT INTO salaries (employee_id, base_salary, deductions, net_salary, period) VALUES (?, ?, ?, ?, ?)",
        [employee_id, base_salary, deductions, net_salary, period]
      );
      await logAudit(user.employee_id, "Add Salary", {
        employee_id,
        base_salary,
        deductions,
        net_salary,
        period,
      });

      console.log(`Salary Added Successfully:
                Employee ID: ${employee_id}
                Base Salary: ${base_salary} KSH
                Deductions: ${deductions} KSH
                Net Salary: ${net_salary} KSH
                Period: ${period}`);
    } catch (error) {
      console.error("Error adding salary:", error.message);
    }
  } else if (action === "Calculate Payroll") {
    console.log("=== Calculate Payroll Form ===");
    const { employee_id, period } = await inquirer.prompt([
      { type: "number", name: "employee_id", message: "Employee ID:" },
      { type: "input", name: "period", message: "Period (e.g., 2025-04):" },
    ]);

    try {
      const [attendance] = await db.query(
        "SELECT SUM(hours_worked) as total_hours, SUM(overtime) as total_overtime FROM attendance WHERE employee_id = ? AND work_date LIKE ?",
        [employee_id, `${period}%`]
      );

      const hours = attendance[0].total_hours || 0;
      const overtime = attendance[0].total_overtime || 0;
      const hourly_rate = 500;

      let tax_rate;
      try {
        const response = await axios.get(process.env.TAX_API_URL, {
          headers: { Authorization: `Bearer ${process.env.TAX_API_KEY}` },
        });
        tax_rate = response.data.rate || 0.3;
      } catch (apiError) {
        console.warn("Tax API unavailable, using default rate (30%)");
        tax_rate = 0.3;
      }

      const gross_salary = hours * hourly_rate + overtime * hourly_rate * 1.5;
      const deductions = gross_salary * tax_rate;
      const net_salary = gross_salary - deductions;

      await db.query(
        "INSERT INTO salaries (employee_id, base_salary, deductions, net_salary, period) VALUES (?, ?, ?, ?, ?)",
        [employee_id, gross_salary, deductions, net_salary, period]
      );
      await logAudit(user.employee_id, "Calculate Payroll", {
        employee_id,
        period,
        net_salary,
      });

      console.log(`Payroll Calculated and Saved:
                Gross Salary: ${gross_salary} KSH
                Deductions: ${deductions} KSH
                Net Salary: ${net_salary} KSH`);
    } catch (error) {
      console.error("Error saving payroll:", error.message);
    }
  } else if (action === "View Payslip") {
    console.log("=== View Payslip Form ===");
    const { employee_id } = await inquirer.prompt([
      { type: "number", name: "employee_id", message: "Employee ID:" },
    ]);

    try {
      const [rows] = await db.query(
        "SELECT * FROM salaries WHERE employee_id = ? ORDER BY salary_id DESC LIMIT 1",
        [employee_id]
      );
      if (rows.length === 0) {
        console.log("No payslip found.");
      } else {
        const payslip = rows[0];
        console.log(`Payslip Retrieved:
                    Period: ${payslip.period}
                    Gross Salary: ${payslip.base_salary} KSH
                    Deductions: ${payslip.deductions} KSH
                    Net Salary: ${payslip.net_salary} KSH`);
      }
    } catch (error) {
      console.error("Error fetching payslip:", error.message);
    }
  }
  return salaryManagement(user);
};
const recordAttendance = async (user) => {
  console.log("=== Record Attendance Form ===");
  const { employee_id, date, hours, overtime } = await inquirer.prompt([
    { type: "number", name: "employee_id", message: "Employee ID:" },
    { type: "input", name: "date", message: "Date (YYYY-MM-DD):" },
    { type: "number", name: "hours", message: "Hours Worked:" },
    { type: "number", name: "overtime", message: "Overtime Hours:" },
  ]);

  try {
    await db.query(
      "INSERT INTO attendance (employee_id, work_date, hours_worked, overtime) VALUES (?, ?, ?, ?)",
      [employee_id, date, hours, overtime]
    );
    await logAudit(user.employee_id, "Record Attendance", {
      employee_id,
      date,
      hours,
      overtime,
    });
    console.log("Attendance data saved to database!");
  } catch (error) {
    console.error("Error saving attendance:", error.message);
  }
  return mainMenu(user);
};

const generateEmployeeReport = async (user) => {
  try {
    const [rows] = await db.query(
      "SELECT e.employee_id, e.employee_name, e.position, d.department_name FROM employees e LEFT JOIN departments d ON e.department_id = d.department_id"
    );
    console.log("=== Employee Report ===");
    rows.forEach((row) =>
      console.log(
        `ID: ${row.employee_id}, Name: ${row.employee_name}, Position: ${
          row.position
        }, Dept: ${row.department_name || "N/A"}`
      )
    );
    await logAudit(user.employee_id, "Generate Employee Report", {});
  } catch (error) {
    console.error("Error generating report:", error.message);
  }
  return mainMenu(user);
};

const generateDepartmentReport = async (user) => {
  try {
    const [rows] = await db.query(
      "SELECT d.department_name, COUNT(e.employee_id) as employee_count FROM departments d LEFT JOIN employees e ON d.department_id = e.department_id GROUP BY d.department_id"
    );
    console.log("=== Department Report ===");
    rows.forEach((row) =>
      console.log(
        `Department: ${row.department_name}, Employees: ${row.employee_count}`
      )
    );
    await logAudit(user.employee_id, "Generate Department Report", {});
  } catch (error) {
    console.error("Error generating report:", error.message);
  }
  return mainMenu(user);
};

const generateLeaveReport = async (user) => {
  try {
    const [rows] = await db.query(
      "SELECT e.employee_name, l.leave_date, l.leave_type, l.status FROM leaves l JOIN employees e ON l.employee_id = e.employee_id"
    );
    console.log("=== Leave Report ===");
    rows.forEach((row) =>
      console.log(
        `Name: ${row.employee_name}, Date: ${row.leave_date}, Type: ${row.leave_type}, Status: ${row.status}`
      )
    );
    await logAudit(user.employee_id, "Generate Leave Report", {});
  } catch (error) {
    console.error("Error generating report:", error.message);
  }
  return mainMenu(user);
};

const generateSalaryReport = async (user) => {
  try {
    const [rows] = await db.query(
      "SELECT e.employee_name, s.base_salary, s.deductions, s.net_salary, s.period FROM salaries s JOIN employees e ON s.employee_id = e.employee_id"
    );
    console.log("=== Salary Report ===");
    rows.forEach((row) =>
      console.log(
        `Name: ${row.employee_name}, Period: ${row.period}, Gross: ${row.base_salary}, Deductions: ${row.deductions}, Net: ${row.net_salary}`
      )
    );
    await logAudit(user.employee_id, "Generate Salary Report", {});
  } catch (error) {
    console.error("Error generating report:", error.message);
  }
  return mainMenu(user);
};

const generateSystemUserReport = async (user) => {
  try {
    const [rows] = await db.query(
      "SELECT employee_id, employee_name, email_id, position FROM employees"
    );
    console.log("=== System User Report ===");
    rows.forEach((row) =>
      console.log(
        `ID: ${row.employee_id}, Name: ${row.employee_name}, Email: ${row.email_id}, Position: ${row.position}`
      )
    );
    await logAudit(user.employee_id, "Generate System User Report", {});
  } catch (error) {
    console.error("Error generating report:", error.message);
  }
  return mainMenu(user);
};

const viewAuditLogs = async (user) => {
  try {
    const [rows] = await db.query(
      "SELECT l.log_id, e.employee_name, l.action, l.timestamp, l.details FROM audit_logs l JOIN employees e ON l.user_id = e.employee_id"
    );
    console.log("=== Audit Logs ===");
    rows.forEach((row) =>
      console.log(
        `ID: ${row.log_id}, User: ${row.employee_name}, Action: ${row.action}, Time: ${row.timestamp}, Details: ${row.details}`
      )
    );
  } catch (error) {
    console.error("Error viewing audit logs:", error.message);
  }
  return mainMenu(user);
};

console.log("Payroll Management System - Twiga Foods");
startScreen();
