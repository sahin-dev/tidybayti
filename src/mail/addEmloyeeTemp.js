const addEmployeeTemp = (data) =>
  ` 
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f2f3f8;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
          }
          h1 {
            color: #1a73e8;
            font-size: 26px;
            margin-bottom: 20px;
            font-weight: bold;
            text-align: center;
          }
          p {
            color: #555555;
            line-height: 1.8;
            font-size: 16px;
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          table th, table td {
            padding: 12px;
            text-align: left;
            border: 1px solid #ddd;
          }
          table th {
            background-color: #f2f3f8;
            font-weight: bold;
          }
          .footer {
            margin-top: 30px;
            font-size: 13px;
            color: #9e9e9e;
            text-align: center;
          }
          .footer p {
            margin: 5px 0;
          }
          a {
            color: #1a73e8;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Welcome to Tidy Bity!</h1>
          <p>Hello, ${data.name},</p>
          <p>We are excited to have you join the team as a new employee. Below are your key details:</p>
          
          <table>
            <tr>
              <th>Employee ID</th>
              <td>${data.employeeId}</td>
            </tr>
            <tr>
              <th>Email</th>
              <td>${data.email}</td>
            </tr>
            <tr>
              <th>Password</th>
              <td>${data.password}</td>
            </tr>
            <tr>
              <th>Phone No</th>
              <td>${data.phoneNumber}</td>
            </tr>
            <tr>
              <th>Job Type</th>
              <td>${data.jobType}</td>
            </tr>
            <tr>
              <th>CPR Number</th>
              <td>${data.CPRNumber}</td>
            </tr>
            <tr>
              <th>CPR Expiry Date</th>
              <td>${data.CPRExpDate}</td>
            </tr>
            <tr>
              <th>Passport Number</th>
              <td>${data.passportNumber}</td>
            </tr>
            <tr>
              <th>Passport Expiry Date</th>
              <td>${data.passportExpDate}</td>
            </tr>
            <tr>
              <th>Note</th>
              <td>${data.note}</td>
            </tr>
            <tr>
              <th>Duty Time</th>
              <td>${data.dutyTime}</td>
            </tr>
            <tr>
              <th>Break Time</th>
              <td>${data.breakTimeStart} - ${data.breakTimeEnd}</td>
            </tr>
            <tr>
              <th>Working Days</th>
              <td>${data.workDays}</td>
            </tr>
            <tr>
              <th>Off Day</th>
              <td>${data.offDay}</td>
            </tr>
          </table>
  
          <p>Your employer has added you to manage household tasks like cleaning, grocery shopping, and cooking. Please log in to your account to get started. If you have any questions, feel free to reach out to your employer or contact us at <a href="mailto:thakursaad613@gmail.com">thakursaad613@gmail.com</a>.</p>
          <p>We’re looking forward to working with you!</p>
          <p>Best regards,<br>The Tidy Bayti Team</p>
        </div>
        <div class="footer">
          <p>&copy; Tidy Bayti - All Rights Reserved.</p>
          <p><a href="https://yourwebsite.com/privacy">Privacy Policy</a> | <a href="https://yourwebsite.com/contact">Contact Support</a></p>
        </div>
      </body>
    </html>
  `;

module.exports = addEmployeeTemp;
