# 🚗 License Management System

A modern, comprehensive web application designed to make driving license management simple, secure, and efficient. This system streamlines the entire process from application submission to license issuance with real-time notifications and robust administrative controls.

![License Management System](https://img.shields.io/badge/Status-Active-success)
![Java](https://img.shields.io/badge/Java-Spring_Boot-orange)
![Frontend](https://img.shields.io/badge/Frontend-HTML%2FCSS%2FJS-blue)
![Security](https://img.shields.io/badge/Security-Spring_Security-green)

## 🌟 Features

### 👨‍💼 User Management
- **Easy Registration**: Simple user registration with detailed form validation
- **Secure Login**: Quick and straightforward authentication system
- **Google OAuth**: Admin and driver login integration with Google authentication
- **Role-based Access**: Different access levels for drivers, staff, and administrators

### 📋 Application Management
- **License Application**: Streamlined driving license application process
- **Application Review**: Admin review and approval/decline system with reasoning
- **Status Tracking**: Real-time application status updates
- **Data Security**: Secure storage and access to user information

### 📚 Examination System
- **Written Exam Scheduling**: Automated exam scheduling with date, time, and location
- **Trial Test Management**: Driving test scheduling and management
- **Result Processing**: Instant result updates and notifications
- **Rescheduling**: Automatic rescheduling for failed or absent candidates

### 💳 Payment Integration
- **PayHere Gateway**: Secure payment processing for approved applications only
- **Payment Verification**: Admin verification and tracking of all transactions
- **Payment Reports**: Comprehensive payment history and reporting
- **Security Controls**: Prevents unauthorized payments before approval

### 📱 Notification System
- **Multi-channel Notifications**: SMS, Email, and Dashboard notifications
- **Real-time Updates**: Instant status updates across all platforms
- **Twilio Integration**: Reliable SMS delivery system
- **Email Automation**: Automated email notifications for all status changes

### 👨‍💻 Administrative Features
- **Staff Management**: Add, update, activate/deactivate staff members
- **Vehicle Records**: Complete vehicle database management
- **Dashboard Analytics**: Real-time statistics and system overview
- **License Issuance**: Online license generation and management
- **Report Generation**: Comprehensive reporting system
- **Cash Payment access**: Manual cash payment recording by admin
- **Manual License Issuance**: Admin can issue licenses manually if required

### 📊 Dashboard Features
- **User Dashboard**: Personal progress tracking and status updates
- **Admin Dashboard**: Complete system overview and management tools
- **Real-time Data**: Live updates without page refresh
- **License Preview**: Digital license preview before physical delivery
- **Print Functionality**: License printing capabilities

## 🏗️ Technical Architecture

### Frontend Technologies
- **HTML5**: Modern semantic markup
- **CSS3**: Responsive design and modern styling
- **JavaScript (ES6+)**: Interactive user interface
- **AJAX**: Asynchronous communication for smooth user experience
- **Fetch API**: Modern data fetching technique

### Backend Technologies
- **Java**: Core programming language
- **Spring Boot**: Application framework
- **Spring Security**: Authentication and authorization
- **Layered Architecture**: Clean separation of concerns

### Third-party Integrations
- **Twilio API**: SMS notification service
- **PayHere Gateway**: Payment processing
- **Google OAuth**: Authentication service
- **Email Service**: Automated email notifications
- **MySQL**: Relational database management
- **JasperReports**: Reporting engine

### Security Features
- **Spring Security**: Comprehensive security framework
- **Role-based Access Control**: Granular permission system
- **Data Encryption**: Secure data storage and transmission
- **Session Management**: Secure user session handling

## 🚀 Getting Started

### Prerequisites
- Java 17 or higher
- Maven 3.6+
- MySQL 8.0+
- Internet connection for third-party API integration

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Anjana-Hesh/SmartReg.git
   cd SmartReg
   ```

2. **Database Setup** 
   ```sql
   CREATE DATABASE license_management;
   ```
   

3. **Configure Application Properties**
   ```properties
   # Database Configuration
   spring.datasource.url=jdbc:mysql://localhost:3306/license_management
   spring.datasource.username=your_username
   spring.datasource.password=your_password
   
   # Twilio Configuration
   twilio.account.sid=your_twilio_sid
   twilio.auth.token=your_twilio_token
   twilio.phone.number=your_twilio_phone
   
   # PayHere Configuration
   payhere.merchant.id=your_merchant_id
   payhere.merchant.secret=your_merchant_secret
   
   # Google OAuth Configuration
   spring.security.oauth2.client.registration.google.client-id=your_client_id
   spring.security.oauth2.client.registration.google.client-secret=your_client_secret
   ```

4. **Build and Run**
   ```bash
   mvn clean install
   mvn spring-boot:run
   ```

5. **Access the Application**
    - Application URL: `http://localhost:8080`
    - Admin Panel: `http://localhost:8080/admin`

## 📱 User Journey

### For Drivers
1. **Registration**: Create account with personal details
2. **Application**: Submit driving license application
3. **Payment**: Make payment after admin approval
4. **Written Exam**: Attend scheduled written examination
5. **Trial Test**: Complete practical driving test
6. **License Issuance**: Receive digital and physical license

### For Administrators
1. **Application Review**: Review and approve/decline applications
2. **Exam Scheduling**: Set dates, times, and locations for exams
3. **Result Management**: Update exam and trial results
4. **Staff Management**: Manage staff members and permissions
5. **System Monitoring**: Monitor overall system performance
6. **Manual License Issuance**: Issue licenses as needed (if required)

## 📈 System Workflow

```
Registration → Application → Admin Review → Payment → Written Exam → Trial Test → License Issuance
     ↓             ↓             ↓           ↓          ↓            ↓             ↓
   Account      Pending       Approved    Completed   Results     Results      Active
   Created      Status        Status      Payment     Updated     Updated      License
```

## 🔔 Notification Flow

- **SMS Notifications**: Instant updates for all status changes
- **Email Notifications**: Detailed information and instructions
- **Dashboard Updates**: Real-time status display
- **Admin Alerts**: System notifications for administrators

## 📊 Reporting Features

- Application statistics and trends
- Payment transaction reports
- Exam result analytics
- System usage metrics
- Staff performance reports

## 🛡️ Security Measures

- **Authentication**: Multi-factor authentication support
- **Authorization**: Role-based access control ("Admin" , "Driver")
- **Data Protection**: Encrypted data storage (Password hashing with BCrypt)
- **API Security**: Secure API endpoints
- **Session Security**: Secure session management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 👨‍💻 Development

This project was developed and maintained by **Anjana Heshan** as a solo developer.  
All backend, frontend, and design work was handled individually.

## 📞 Support

For support and queries, please contact:
- Email: anjanaheshan676@gmail.com
- Phone: +94-764-810-851
- Documentation: [Wiki](https://github.com/Anjana-Hesh/SmartReg/wiki)

## 🚀 Future Enhancements

- Upgraded to Renewal and Suspension Management (!important)
- Mobile application development
- Advanced analytics dashboard (In Progress)
- Multi-language support (now only English , Sinhala, Tamil)
- Integration with government databases
- AI-powered application processing
- Voice command features
- Interactive tutorials for driving tests
- Enhanced security protocols
- interactive chat support
- Interactive with lernesses for driving practice
- Blockchain-based license verification

## 📝 Changelog

### Version 1.0.0
- Initial release with core functionality
- User registration and authentication
- Admin panel with full management features
- Payment gateway integration
- SMS and email notification system
- Real-time dashboard updates

---

**Experience the future of license management — fast, reliable, and accessible anytime, anywhere.**

Made with ❤️ by [Anjana Heshan]