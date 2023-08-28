import React, { useEffect, useState } from "react";
import axios from "axios";
import "./profile.css";
function Profile() {
  const [admins, setAdmins] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:8081/admins")
      .then((res) => {
        setAdmins(res.data);
      })
      .catch((err) => console.log(err));
  }, []);

  return (
    <div className="profile-container">
      <h2>Admin Profiles</h2>
      <div className="table-responsive">
        <table className="table table-bordered">
          <thead>
            <tr>
              {/* <th>ID</th> */}
              <th>Email</th>
              {/* <th>Role</th> */}
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin.email}>
                {/* <td>{admin.id}</td> */}
                <td>{admin.email}</td>
                {/* <td>{admin.role}</td> */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Profile;
