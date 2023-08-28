import express from "express";
import mysql from "mysql";
import cors from "cors";
import cookieParser from "cookie-parser";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
// below 2 packages we are using to import the image/file from createForm to node express
import multer from "multer";
import path from "path";
import "dotenv/config";
const app = express();

app.use(
  cors(
    //   to access cookies
    {
      origin: ["http://localhost:5173"],
      methods: ["POST", "GET", "PUT"],
      credentials: true,
    }
  )
);

app.use(cookieParser());
app.use(express.json());
app.use(express.static("public"));

// Connection with the database
const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "signup",
});

// display images using multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images"); // cb = callback
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname) // ex. image_1692897380912.jpg, extname = extension name
    );
  },
});

// upload middleware
const upload = multer({
  storage: storage,
});

// Connection with the database
con.connect(function (err) {
  if (err) {
    console.log("Error in Connection");
  } else {
    console.log("Connected");
  }
});

// fetch employee from database
app.get("/getEmployee", (req, res) => {
  const sql = "SELECT * FROM employee";
  con.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Get employee error in sql" });
    return res.json({ Status: "Success", Result: result });
  });
});

// get employee id to edit the employee record
app.get("/get/:id", (req, res) => {
  const id = req.params.id;
  const sql = "SELECT * FROM employee where id = ?";
  con.query(sql, [id], (err, result) => {
    if (err) return res.json({ Error: "Get employee error in sql" });
    return res.json({ Status: "Success", Result: result });
  });
});

// update the employee record
app.put("/update/:id", (req, res) => {
  const id = req.params.id;
  const sql = "UPDATE employee set salary = ? WHERE id = ?";
  con.query(sql, [req.body.salary, id], (err, result) => {
    if (err) return res.json({ Error: "update employee error in sql" });
    return res.json({ Status: "Success" });
  });
});

// delete employee from database
app.delete("/delete/:id", (req, res) => {
  const id = req.params.id;
  const sql = "Delete FROM employee WHERE id = ?";
  con.query(sql, [id], (err, result) => {
    if (err) return res.json({ Error: "delete employee error in sql" });
    return res.json({ Status: "Success" });
  });
});

// for authentication
const verifyUser = (req, res, next) => {
  // read cookies
  const token = req.cookies.token;
  if (!token) {
    return res.json({ Error: "You are not Authenticated" });
  } else {
    jwt.verify(token, process.env.KEY, (err, decoded) => {
      if (err) return res.json({ Error: "Token is wrong" });
      req.role = decoded.role;
      req.id = decoded.id;
      next();
    });
  }
};

app.get("/dashboard", verifyUser, (req, res) => {
  return res.json({ Status: "Success", role: req.role, id: req.id });
});

// API for adminCount in dashboard
app.get("/adminCount", (req, res) => {
  const sql = "Select count(id) as admin from users";
  con.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Error in running query" });
    return res.json(result);
  });
});

// API for employeeCount in dashboard
app.get("/employeeCount", (req, res) => {
  const sql = "Select count(id) as employee from employee";
  con.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Error in running query" });
    return res.json(result);
  });
});

// API for salary in dashboard
app.get("/salary", (req, res) => {
  const sql = "Select sum(salary) as sumOfSalary from employee";
  con.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Error in running query" });
    return res.json(result);
  });
});

// Login Api
app.post("/login", (req, res) => {
  const sql = "SELECT * FROM users Where email = ? AND  password = ?";
  con.query(sql, [req.body.email, req.body.password], (err, result) => {
    if (err)
      return res.json({ Status: "Error", Error: "Error in running query" });
    if (result.length > 0) {
      const id = result[0].id;
      // generate token if login successfully
      const token = jwt.sign({ role: "admin" }, process.env.KEY, {
        expiresIn: "1d",
      });
      //   store that token in the cookies now
      res.cookie("token", token);

      return res.json({ Status: "Success" });
    } else {
      return res.json({ Status: "Error", Error: "Wrong Email or Password" });
    }
  });
});

// api for employee's login
app.post("/employeelogin", (req, res) => {
  const sql = "SELECT * FROM employee Where email = ?";
  con.query(sql, [req.body.email], (err, result) => {
    if (err)
      return res.json({ Status: "Error", Error: "Error in runnig query" });
    if (result.length > 0) {
      bcrypt.compare(
        req.body.password.toString(),
        result[0].password,
        (err, response) => {
          if (err) return res.json({ Error: "password error" });
          if (response) {
            const token = jwt.sign(
              { role: "employee", id: result[0].id },
              process.env.KEY,
              { expiresIn: "1d" }
            );
            res.cookie("token", token);
            return res.json({ Status: "Success", id: result[0].id });
          } else {
            return res.json({
              Status: "Error",
              Error: "Wrong Email or Password",
            });
          }
        }
      );
    } else {
      return res.json({ Status: "Error", Error: "Wrong Email or Password" });
    }
  });
});

app.get("/employee/:id", (req, res) => {
  const id = req.params.id;
  const sql = "SELECT * FROM employee where id = ?";
  con.query(sql, [id], (err, result) => {
    if (err) return res.json({ Error: "Get employee error in sql" });
    return res.json({ Status: "Success", Result: result });
  });
});

app.get("/admins", (req, res) => {
  const sql = "SELECT email FROM users";
  con.query(sql, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    const admins = result.map((admin) => ({
      email: admin.email,
      username: admin.username,
      role: admin.role,
    }));
    return res.json(admins);
  });
});

// logout api
app.get("/logout", (req, res) => {
  res.clearCookie("token");
  return res.json({ Status: "Success" });
});

// create api
app.post("/create", upload.single("image"), (req, res) => {
  const sql =
    "INSERT INTO employee (`name`,`email`,`password`, `address`, `salary`,`image`) VALUES (?)";
  // password hashing
  bcrypt.hash(req.body.password.toString(), 10, (err, hash) => {
    // will add 10 random characters before hashing the password
    if (err) return res.json({ Error: "Error in hashing password" });
    const values = [
      req.body.name,
      req.body.email,
      hash,
      req.body.address,
      req.body.salary,
      req.file.filename,
    ];
    con.query(sql, [values], (err, result) => {
      if (err) return res.json({ Error: "Inside singup query" });
      return res.json({ Status: "Success" });
    });
  });
  //   console.log(req.body);
});

app.listen(8081, () => {
  console.log("Running");
});
