$(document).ready(function () {

  const API_BASE_URL = "http://localhost:8080/api/v1";

  const authToken = localStorage.getItem("smartreg_token") || sessionStorage.getItem("smartreg_token");
  const userData = JSON.parse( localStorage.getItem("smartreg_user") || "{}" );

  const currentDriverId = userData.id;
  const currentDriverName = userData.fullName;

  let selectedVehicleClasses = [];
  let currentApplications = [];
  let currentNotifications = [];
  let refreshInterval;

  checkPayHereLoaded().then((loaded) => {
      if (loaded) {
          console.log("✅ PayHere loaded successfully");
      } else {
          console.warn("⚠️ PayHere failed to load");
      }
  });

  // =================== AUTHENTICATION CHECK ===================

  if (!authToken || !currentDriverId) {
    
    Swal.fire({
      title: "Authentication Required",
      text: "Please login to continue",
      icon: "error",
      confirmButtonText: "Login Now",
      allowOutsideClick: false,
    }).then(() => {
      window.location.href = "../index.html";
    });
    return;
  
  }

  // =================== AJAX SETUP WITH AUTH ===================

  $.ajaxSetup({
    beforeSend: function (xhr) {
      if (authToken) {
        xhr.setRequestHeader("Authorization", "Bearer " + authToken);
      }
    },
    error: function (xhr, status, error) {
      if (xhr.status === 401) {
        handleUnauthorized();
      } else if (xhr.status === 403) {
        showAlert(
          "Access Denied",
          "You don't have permission to perform this action",
          "error"
        );
      }
    },
  });

  // =================== VEHICLE CLASSES DATA ===================

  const vehicleClassesByLicense = {
    
    learner: [
      { value: "A1", text: "Class A1 - Light Motorcycles (up to 125cc)" },
      { value: "B1", text: "Class B1 - Light Motor Cars (up to 1000cc)" },
      { value: "G1", text: "Class G1 - Agricultural Tractors" },
    ],
    
    restricted: [
      { value: "A1", text: "Class A1 - Light Motorcycles (up to 125cc)" },
      { value: "A", text: "Class A - Heavy Motorcycles (above 125cc)" },
      { value: "B1", text: "Class B1 - Light Motor Cars (up to 1000cc)" },
      { value: "B", text: "Class B - Motor Cars (above 1000cc)" },
      { value: "G1", text: "Class G1 - Agricultural Tractors" },
    ],
    
    full: [
      { value: "A1", text: "Class A1 - Light Motorcycles (up to 125cc)" },
      { value: "A", text: "Class A - Heavy Motorcycles (above 125cc)" },
      { value: "B1", text: "Class B1 - Light Motor Cars (up to 1000cc)" },
      { value: "B", text: "Class B - Motor Cars (above 1000cc)" },
      { value: "C1", text: "Class C1 - Light Goods Vehicles (3.5t - 7.5t)" },
      { value: "C", text: "Class C - Heavy Goods Vehicles (above 7.5t)" },
      { value: "D1", text: "Class D1 - Minibuses (9-16 seats)" },
      { value: "D", text: "Class D - Large Buses (above 16 seats)" },
      { value: "G1", text: "Class G1 - Agricultural Tractors" },
      { value: "G", text: "Class G - Heavy Agricultural Vehicles" },
    ],
    
    heavy: [
      { value: "C1", text: "Class C1 - Light Goods Vehicles (3.5t - 7.5t)" },
      { value: "C", text: "Class C - Heavy Goods Vehicles (above 7.5t)" },
      { value: "CE", text: "Class CE - Articulated Heavy Goods Vehicles" },
      { value: "D1", text: "Class D1 - Minibuses (9-16 seats)" },
      { value: "D", text: "Class D - Large Buses (above 16 seats)" },
      { value: "DE", text: "Class DE - Articulated Buses" },
      { value: "G", text: "Class G - Heavy Agricultural Vehicles" },
      { value: "H", text: "Class H - Construction Vehicles" },
    ],
    
    commercial: [
      { value: "J1", text: "Class J1 - Three Wheeler (Commercial)" },
      { value: "J2", text: "Class J2 - Taxi/Hire Cars" },
      { value: "J3", text: "Class J3 - Tourist Transport Vehicles" },
      { value: "C", text: "Class C - Heavy Goods Vehicles (above 7.5t)" },
      { value: "CE", text: "Class CE - Articulated Heavy Goods Vehicles" },
      { value: "D", text: "Class D - Large Buses (above 16 seats)" },
      { value: "DE", text: "Class DE - Articulated Buses" },
    ],
    
    international: [
      { value: "A1", text: "Class A1 - Light Motorcycles (up to 125cc)" },
      { value: "A", text: "Class A - Heavy Motorcycles (above 125cc)" },
      { value: "B1", text: "Class B1 - Light Motor Cars (up to 1000cc)" },
      { value: "B", text: "Class B - Motor Cars (above 1000cc)" },
      { value: "C1", text: "Class C1 - Light Goods Vehicles (3.5t - 7.5t)" },
      { value: "C", text: "Class C - Heavy Goods Vehicles (above 7.5t)" },
      { value: "D1", text: "Class D1 - Minibuses (9-16 seats)" },
      { value: "D", text: "Class D - Large Buses (above 16 seats)" },
    ],
    
    motorcycle: [
      { value: "A1", text: "Class A1 - Light Motorcycles (up to 125cc)" },
      { value: "A2", text: "Class A2 - Medium Motorcycles (125cc - 400cc)" },
      { value: "A", text: "Class A - Heavy Motorcycles (above 400cc)" },
      { value: "AM", text: "Class AM - Mopeds (up to 50cc)" },
      { value: "Q", text: "Class Q - Three Wheelers (Private)" },
    ],
    
    special: [
      { value: "F", text: "Class F - Emergency Vehicles (Ambulance, Fire)" },
      { value: "K", text: "Class K - Military Vehicles" },
      { value: "L", text: "Class L - Special Construction Vehicles" },
      { value: "M", text: "Class M - Cranes and Mobile Equipment" },
      { value: "N", text: "Class N - Road Maintenance Vehicles" },
      { value: "P", text: "Class P - Police Vehicles" },
      { value: "R", text: "Class R - Racing Vehicles" },
      { value: "S", text: "Class S - School Transport" },
    ],
  
  };
  

  // =================== API FUNCTIONS ===================

  function loadDriverApplications() {
    
    return $.ajax({
      url: `${API_BASE_URL}/applications/driver/${currentDriverId}`,
      method: "GET",
      
      success: function (applications) {
        currentApplications = applications || [];
        updateDashboardWithApplications(currentApplications);
        console.log("Applications loaded:", applications);
      },
      
      error: function (xhr) {
        if (xhr.status === 404) {
          currentApplications = [];
          updateDashboardWithApplications([]);
        } else {
          console.error("Failed to load applications:", xhr.responseText);
        }
      },
    });
  }

  function getDeclineReason(applicationId) {
    
    return $.ajax({
      url: `${API_BASE_URL}/declines/application/${applicationId}`,
      method: "GET",
      
      success: function (declineData) {
        console.log("Decline data:", declineData);
        return (
          declineData?.declineReason ||
          declineData?.reason ||
          "No specific reason provided"
        );
      },
      
      error: function (xhr) {
        console.error("Failed to get decline reason:", xhr.responseText);
        return "Unable to retrieve decline reason";
      },
    });
  }

  function getWrittenExamDetails(applicationId) {
    
    return $.ajax({
        url: `${API_BASE_URL}/written-exams/application/${applicationId}`,
        method: "GET",
        headers: {
            Authorization: "Bearer " + (localStorage.getItem("smartreg_token") || sessionStorage.getItem("smartreg_token")),
            "Content-Type": "application/json",
        },
    })
    .then(function (examDetails) {
        console.log("Raw exam details response:", examDetails);

        const isRealExam = examDetails && examDetails.id !== null && examDetails.id !== undefined;

        let normalizedResponse = {
            id: examDetails.id || null,
            writtenExamDate: examDetails.writtenExamDate || null,
            writtenExamTime: examDetails.writtenExamTime || null,
            writtenExamLocation: examDetails.writtenExamLocation || "Not scheduled yet",
            writtenExamResult: examDetails.writtenExamResult || null,
            note: examDetails.note || (isRealExam ? "No additional notes" : "No written exam scheduled for this application"),
            applicationId: examDetails.applicationId || applicationId,
            driverName: examDetails.driverName || null,
            licenseType: examDetails.licenseType || null,
            examLanguage: examDetails.examLanguage || null,
            trialDate: examDetails.trialDate || null,
            nextExamDate:examDetails.nextExamDate || "3 Months again" || null,
            isScheduled: isRealExam,
            trialExams: []
        };

        if (examDetails.writtenExamResult === "PASS" && examDetails.id) {
            return getTrialExamDetails(examDetails.id).then(function(trialExams) {
                normalizedResponse.trialExams = trialExams;
                return normalizedResponse;
            }).catch(function(error) {
                console.warn("Failed to fetch trial exams, continuing without trial data:", error);
                return normalizedResponse;
            });
        }

        console.log("Normalized exam details:", normalizedResponse);
        return normalizedResponse;
    })
    .catch(function (error) {
        console.error("Failed to get written exam details:", error);

        return {
            id: null,
            writtenExamDate: null,
            writtenExamTime: null,
            writtenExamLocation: "Error loading details",
            writtenExamResult: null,
            note: "Failed to load exam details - " + (error.responseJSON?.message || error.statusText || "Unknown error"),
            applicationId: applicationId,
            driverName: null,
            licenseType: null,
            examLanguage: null,
            trialDate: null,
            isScheduled: false,
            trialExams: [],
            error: true,
        };
    });
  }

  function submitLicenseApplication(applicationData, photoFile, medicalFile) {
    
    const formData = new FormData();

    const applicationJson = {
      driverId: currentDriverId,
      licenseType: applicationData.licenseType,
      examLanguage: applicationData.examLanguage,
      vehicleClasses: selectedVehicleClasses.map((vc) => vc.value),
      nicNumber: applicationData.nicNumber,
      bloodGroup: applicationData.bloodGroup,
      dateOfBirth: applicationData.dateOfBirth,
      phoneNumber: applicationData.phoneNumber,
      address: applicationData.address,
    };

    formData.append("application", JSON.stringify(applicationJson));
    formData.append("photo", photoFile);
    formData.append("medical", medicalFile);

    return $.ajax({
      url: `${API_BASE_URL}/applications/create-application`,
      method: "POST",
      data: formData,
      processData: false,
      contentType: false,
    });
  }

    // =================== DASHBOARD UPDATES ===================

  function updateDashboardWithApplications(applications) {
    
    const licenseCard = $(".license-info-card .card-content");

    if (applications.length === 0) {
      
      licenseCard.html(`
                <p>Complete your license registration to get started with your driving journey.</p>
                <button class="btn-card" onclick="showLicenseForm()">
                    <i class="fas fa-edit me-1"></i> Register License
                </button>
            `);
      updateLicenseStatus("none");
      return;
    }

    const latestApplication = applications[0];
    const statusBadgeClass = getStatusBadgeClass(latestApplication.status);
    const vehicleClasses = Array.isArray(latestApplication.vehicleClasses) ? latestApplication.vehicleClasses.join(", ") : "N/A";

    licenseCard.html(`
            <div class="application-summary">
                <div class="summary-header">
                    <h6>Latest Application: #${latestApplication.id}</h6>
                    <span class="badge bg-${statusBadgeClass}">${latestApplication.status}</span>
                </div>
                <div class="summary-details" id="summary">
                    <p><strong>License Type:</strong> ${latestApplication.licenseType.toUpperCase()}</p>
                    <p><strong>Vehicle Classes:</strong> ${vehicleClasses}</p>
                    <p><strong>Submitted:</strong> ${formatDate(
                      latestApplication.submittedDate
                    )}</p>
                </div>
                
                <div class="summary-actions">
                    <button class="btn-card me-2" onclick="viewApplicationDetails('${
                      latestApplication.id
                    }')">
                        <i class="fas fa-eye me-1"></i> View Details
                    </button>
                    ${
                      latestApplication.status === "REJECTED"
                        ? `
                        <button class="btn-card btn-warning" onclick="showLicenseForm()">
                            <i class="fas fa-redo me-1"></i> Reapply
                        </button>
                    `
                        : latestApplication.status === "APPROVED"
                        ? `
                        <button class="btn-card btn-success" onclick="showPaymentForm()">
                            <i class="fas fa-credit-card me-1"></i> Make Payment
                        </button>
                    `
                        : applications.filter((app) => app.status === "PENDING")
                            .length === 0
                        ? `
                        <button class="btn-card btn-secondary" onclick="showLicenseForm()">
                            <i class="fas fa-plus me-1"></i> New Application
                        </button>
                    `
                        : ""
                    }
                </div>
            </div>
        `);

    updateLicenseStatus(latestApplication.status, latestApplication);
  }

  function updateLicenseStatus(status, licenseData = null) {
    
    const statusBadge = $("#licenseStatus");

    switch (status) {
      case "APPROVED":
        statusBadge
          .removeClass("status-pending status-none status-rejected")
          .addClass("status-active")
          .html('<i class="fas fa-check-circle me-1"></i> Application Approved');
        break;
      case "PENDING":
        statusBadge
          .removeClass("status-active status-none status-rejected")
          .addClass("status-pending")
          .html('<i class="fas fa-clock me-1"></i> Application Pending');
        break;
      case "REJECTED":
        statusBadge
          .removeClass("status-active status-pending status-none")
          .addClass("status-rejected")
          .html(
            '<i class="fas fa-times-circle me-1"></i> Application Rejected'
          );
        break;
      case "none":
          statusBadge
          .removeClass("status-active status-pending status-rejected")
          .addClass("status-none")
          .html('<i class="fas fa-check-circle me-1" style="color: green;"></i> No License');
      default:
        statusBadge
        .removeClass("status-active status-pending status-rejected")
        .addClass("status-success")
        .html('<i class="fas fa-check-circle me-1" style="color: green;"></i> COMPLETED');

    }
  }

  function getStatusBadgeClass(status) {
    switch (status) {
      case "APPROVED":
        return "success";
      case "REJECTED":
        return "danger";
      case "PENDING":
        return "warning";
      default:
        return "secondary";
    }
  }

  // =================== ENHANCED SMART NOTIFICATIONS ===================

  function loadSmartNotifications() {
    const notifications = [];

    console.log("Notification load function wada ..!");
    
    if (currentApplications.length === 0) {
     
      notifications.push({
        id: "welcome",
        message:
          "🎉 Welcome to LicensePro! Your digital driving license companion.",
        type: "WELCOME",
        priority: "HIGH",
        createdDate: new Date().toISOString(),
        isRead: false,
        icon: "fas fa-star",
        bgColor: "#28a745",
        details: "Get started by submitting your first license application!",
      });

      notifications.push({
        id: "getting_started",
        message:
          "🚗 Ready to hit the road? Click 'Register License' to begin your journey!",
        type: "GUIDE",
        priority: "MEDIUM",
        createdDate: new Date().toISOString(),
        isRead: false,
        icon: "fas fa-road",
        bgColor: "#17a2b8",
        actionText: "Start Application",
        actionFunction: () => showLicenseForm(),
      });
    } else {
      currentApplications.forEach((app) => {
        processApplicationNotifications(app, notifications);
      });
    }

    currentNotifications = notifications.sort((a, b) => {
      const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      const aPriority = priorityOrder[a.priority] || 0;
      const bPriority = priorityOrder[b.priority] || 0;

      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      return new Date(b.createdDate) - new Date(a.createdDate);
    });

    renderSmartNotifications(currentNotifications);
    updateNotificationBadge(notifications.filter((n) => !n.isRead).length);

    return Promise.resolve(notifications);
  }

  async function processApplicationNotifications(app, notifications) {
    
    const appId = app.id;
    const status = app.status;
    const submittedDate = new Date(app.submittedDate);
    const daysSinceSubmission = Math.floor(
      (new Date() - submittedDate) / (1000 * 60 * 60 * 24)   // to get the millisecond of a day
    );

    console.log("appId of processApplicationNotifications: " + appId);

    switch (status) {
      case "PENDING":

      notifications.push({
          id: `pending_${appId}`,
          message: `⏳ Application #${appId} is under review`,
          details: `Submitted ${daysSinceSubmission} day${
            daysSinceSubmission !== 1 ? "s" : ""
          } ago\nTypical review time: 3-5 business days`,
          type: "APPLICATION_PENDING",
          priority: "MEDIUM",
          createdDate: app.submittedDate,
          isRead: false,
          icon: "fas fa-clock",
          bgColor: "#ffc107",
          applicationId: appId,
        });

        if (daysSinceSubmission > 7) {
          notifications.push({
            id: `pending_delay_${appId}`,
            message: `⚠️ Application #${appId} review is taking longer than expected`,
            details: `Your application has been under review for ${daysSinceSubmission} days. Our team is working on it and will update you soon.`,
            type: "DELAY_WARNING",
            priority: "HIGH",
            createdDate: new Date().toISOString(),
            isRead: false,
            icon: "fas fa-exclamation-triangle",
            bgColor: "#fd7e14",
            applicationId: appId,
          });
        }

        if (daysSinceSubmission >= 3) {
          notifications.push({
            id: `pending_encourage_${appId}`,
            message: `💪 Hang tight! Your application is being carefully reviewed`,
            details:
              "Quality review takes time. We're ensuring everything is perfect for your license approval!",
            type: "ENCOURAGEMENT",
            priority: "LOW",
            createdDate: new Date().toISOString(),
            isRead: false,
            icon: "fas fa-thumbs-up",
            bgColor: "#6f42c1",
          });
        }
        break;

      case "REJECTED":
        try {
          const declineReason = await getDeclineReason(appId);
          const formattedReason =
            declineReason.declineReason || "No specific reason provided";

          notifications.push({
            id: `rejected_${appId}`,
            message: `❌ Application #${appId} was rejected`,
            details: `Reason: ${formattedReason}\n\nDon't worry! You can fix the issues and reapply.`,
            type: "APPLICATION_REJECTED",
            priority: "URGENT",
            createdDate: app.lastModifiedDate || app.submittedDate,
            isRead: false,
            icon: "fas fa-times-circle",
            bgColor: "#dc3545",
            applicationId: appId,
            rejectionReason: formattedReason,
            actionText: "View Details & Reapply",
            actionFunction: () => showRejectionDetails(appId, formattedReason),
          });

          notifications.push({
            id: `reapply_guide_${appId}`,
            message: `📝 Ready to reapply? Here's what you need to know`,
            details: `1. Review the rejection reason carefully\n2. Gather correct documents\n3. Double-check all information\n4. Submit your new application`,
            type: "REAPPLY_GUIDE",
            priority: "MEDIUM",
            createdDate: new Date().toISOString(),
            isRead: false,
            icon: "fas fa-redo",
            bgColor: "#17a2b8",
            actionText: "Start New Application",
            actionFunction: () => showLicenseForm(),
          });
        } catch (error) {
          console.error("Error processing rejection:", error);
          notifications.push({
            id: `rejected_generic_${appId}`,
            message: `❌ Application #${appId} was rejected`,
            details:
              "Please contact support for details about the rejection reason.",
            type: "APPLICATION_REJECTED",
            priority: "URGENT",
            createdDate: app.lastModifiedDate || app.submittedDate,
            isRead: false,
            icon: "fas fa-times-circle",
            bgColor: "#dc3545",
            applicationId: appId,
          });
        }
        break;

      case "COMPLETED":
        try {
          notifications.push({
            id: `completed_${appId}`,
            message: `🎊 Congratulations! Application #${appId} is now COMPLETED!`,
            details: `✅ Your license process has been successfully completed.\n\nYou will receive your driving license card soon. 🚗💨`,
            type: "APPLICATION_COMPLETED",
            priority: "HIGH",
            createdDate: app.lastModifiedDate || new Date().toISOString(),
            isRead: false,
            icon: "fas fa-trophy",
            bgColor: "#ffc107",
            applicationId: appId,
            actionText: "View License Status",
            actionFunction: () => showLicenseStatus(appId),
          });
        } catch (error) {
          console.error("Error handling COMPLETED state:", error);
        }
        break;
 
      case "APPROVED":
        try {
          const examDetails = await getWrittenExamDetails(appId);

          if (examDetails) {
            const examDate = new Date(examDetails.writtenExamDate);
            const isUpcoming = examDate > new Date();
            const daysUntilExam = Math.ceil(
              (examDate - new Date()) / (1000 * 60 * 60 * 24)
            );

            notifications.push({
              id: `approved_${appId}`,
              message: `🎉 Congratulations! Application #${appId} has been approved!`,
              details: `📅 Exam Date: ${formatDate(
                examDetails.writtenExamDate
              )}\n⏰ Time: ${examDetails.writtenExamTime || "TBA"}\n📍 Location: ${
                examDetails.writtenExamLocation || "Will be announced soon"
              }\n\n💳 Payment is now available for your exam fee.`,
              type: "APPLICATION_APPROVED",
              priority: "HIGH",
              createdDate: app.lastModifiedDate || app.submittedDate,
              isRead: false,
              icon: "fas fa-check-circle",
              bgColor: "#28a745",
              applicationId: appId,
              examDetails: examDetails,
              actionText: "Make Payment",
              actionFunction: () => showPaymentForm(),
            });

            if (isUpcoming) {
              if (daysUntilExam <= 1) {
                notifications.push({
                  id: `exam_tomorrow_${appId}`,
                  message: `🚨 URGENT: Written exam ${
                    daysUntilExam === 0 ? "TODAY" : "TOMORROW"
                  }!`,
                  details: `📅 ${formatDate(examDetails.writtenExamDate)} at ${
                    examDetails.writtenExamTime || "TBA"
                  }\n📍 ${
                    examDetails.writtenExamLocation || "Location TBA"
                  }\n\n⚡ Don't forget to bring your NIC and arrive 30 minutes early!`,
                  type: "EXAM_URGENT",
                  priority: "URGENT",
                  createdDate: new Date().toISOString(),
                  isRead: false,
                  icon: "fas fa-bell-ring",
                  bgColor: "#e74c3c",
                  applicationId: appId,
                  examDetails: examDetails,
                });
              } else if (daysUntilExam <= 7) {
                notifications.push({
                  id: `exam_week_${appId}`,
                  message: `📚 Written exam in ${daysUntilExam} days - Time to prepare!`,
                  details: `📅 ${formatDate(examDetails.writtenExamDate)} at ${
                    examDetails.writtenExamTime || "TBA"
                  }\n📍 ${
                    examDetails.writtenExamLocation || "Location TBA"
                  }\n\n📖 Study tips: Review traffic rules, road signs, and license-specific requirements.`,
                  type: "EXAM_PREPARATION",
                  priority: "HIGH",
                  createdDate: new Date().toISOString(),
                  isRead: false,
                  icon: "fas fa-graduation-cap",
                  bgColor: "#e83e8c",
                  applicationId: appId,
                  examDetails: examDetails,
                  actionText: "View Exam Details",
                  actionFunction: () => showExamDetails(examDetails),
                });
              } else if (daysUntilExam <= 14) {
                notifications.push({
                  id: `exam_2weeks_${appId}`,
                  message: `📝 Exam scheduled - ${daysUntilExam} days to go!`,
                  details: `Your written exam is coming up. Make sure to complete your payment and start preparing!`,
                  type: "EXAM_SCHEDULED",
                  priority: "MEDIUM",
                  createdDate: new Date().toISOString(),
                  isRead: false,
                  icon: "fas fa-calendar-check",
                  bgColor: "#17a2b8",
                  applicationId: appId,
                  examDetails: examDetails,
                });
              }
            }

            if (examDetails.writtenExamResult) {
              const resultIcon =
                examDetails.writtenExamResult === "PASS"
                  ? "fas fa-trophy"
                  : examDetails.writtenExamResult === "FAIL" || examDetails.writtenExamResult === "ABSANT"
                  ? "fas fa-times-circle"
                  : "fas fa-clock";
              const resultColor =
                examDetails.writtenExamResult === "PASS"
                  ? "#28a745"
                  : examDetails.writtenExamResult === "FAIL" || examDetails.writtenExamResult === "ABSANT"
                  ? "#dc3545"
                  : "#ffc107";
              const resultMessage =
                examDetails.writtenExamResult === "PASS"
                  ? `🏆 Congratulations! You PASSED your written exam!`
                  : examDetails.writtenExamResult === "FAIL" || "ABSANT"
                  ? `😔 You didn't pass this time, but don't give up!`
                  : `⏳ Your exam result is being processed`;

              notifications.push({
                id: `exam_result_${appId}`,
                message: resultMessage,
                details: examDetails.note
                  ? `Examiner's note: ${examDetails.note}`
                  : examDetails.writtenExamResult === "PASS"
                  ? "Great job! Next step: Practical driving test scheduling."
                  : examDetails.writtenExamResult === "FAIL" || examDetails.writtenExamResult === "ABSANT"
                  ? "You can retake the exam. Keep studying and try again!"
                  : "Results will be available soon.",
                type: "EXAM_RESULT",
                priority: "HIGH",
                createdDate: new Date().toISOString(),
                isRead: false,
                icon: resultIcon,
                bgColor: resultColor,
                applicationId: appId,
                examDetails: examDetails,
              });
            }
          } else {
            notifications.push({
              id: `approved_no_exam_${appId}`,
              message: `✅ Application #${appId} approved! Exam scheduling in progress`,
              details:
                "Your application has been approved! The written exam will be scheduled soon and you'll be notified with the details.",
              type: "APPLICATION_APPROVED",
              priority: "HIGH",
              createdDate: app.lastModifiedDate || app.submittedDate,
              isRead: false,
              icon: "fas fa-check-circle",
              bgColor: "#28a745",
              applicationId: appId,
            });
          }
        } catch (error) {
          console.error("Failed to get exam details for app:", appId);

          notifications.push({
            id: `approved_generic_${appId}`,
            message: `✅ Application #${appId} has been approved!`,
            details:
              "Congratulations! Your exam will be scheduled soon. Payment options are now available.",
            type: "APPLICATION_APPROVED",
            priority: "HIGH",
            createdDate: app.lastModifiedDate || app.submittedDate,
            isRead: false,
            icon: "fas fa-check-circle",
            bgColor: "#28a745",
            applicationId: appId,
            actionText: "Make Payment",
            actionFunction: () => showPaymentForm(),
          });
        }
        break;
    }

    renderSmartNotifications(notifications);
    addContextualTips(app, notifications);
  }

  // For the reminders , It may be helpful for the user 
  function addContextualTips(app, notifications) {
    const daysSinceSubmission = Math.floor(
      (new Date() - new Date(app.submittedDate)) / (1000 * 60 * 60 * 24)
    );

    if (app.status === "PENDING" && daysSinceSubmission === 1) {
      notifications.push({
        id: `tip_documents_${app.id}`,
        message: `💡 Pro Tip: Keep your documents ready!`,
        details:
          "While waiting for approval, ensure you have:\n• Valid NIC\n• Medical certificate\n• Passport-size photo\n• Any additional requirements",
        type: "TIP",
        priority: "LOW",
        createdDate: new Date().toISOString(),
        isRead: false,
        icon: "fas fa-lightbulb",
        bgColor: "#6f42c1",
      });
    }

    if (app.status === "APPROVED") {
      notifications.push({
        id: `tip_exam_prep_${app.id}`,
        message: `📚 Study Smart: Exam preparation tips`,
        details:
          "• Review the Highway Code\n• Practice online mock tests\n• Study your vehicle class requirements\n• Get plenty of rest before the exam",
        type: "STUDY_TIP",
        priority: "LOW",
        createdDate: new Date().toISOString(),
        isRead: false,
        icon: "fas fa-book",
        bgColor: "#17a2b8",
      });
    }
  }

  function renderSmartNotifications(notifications) {
    
    const container = $("#notificationList");
    container.empty();

    if (!notifications || notifications.length === 0) {
      container.html(`
                <div class="empty-notifications">
                    <i class="fas fa-bell-slash empty-icon"></i>
                    <p>No notifications yet</p>
                    <small>New updates will appear here</small>
                </div>
            `);
      return;
    }

    notifications.forEach((notification) => {
      const priorityClass = notification.priority ? `priority-${notification.priority.toLowerCase()}` : "";
      const unreadClass = !notification.isRead ? "unread" : "";

      const notificationHtml = `<li class="smart-notification-item ${unreadClass} ${priorityClass}" data-id="${ notification.id }">
                                <div class="notification-icon" style="background-color: ${ notification.bgColor || "#6c757d" }">
                                    <i class="${notification.icon || "fas fa-bell"}"></i>
                                </div>
                                <div class="notification-content">
                                    <div class="notification-header">
                                        <div class="notification-message">${ notification.message }</div>
                                        <div class="notification-date">
                                            <i class="far fa-calendar-alt me-1"></i> 
                                            ${formatRelativeDate(notification.createdDate)}
                                        </div>
                                    </div>
                                    ${ notification.details ? `
                                        <div class="notification-details">
                                            ${notification.details.replace(/\n/g, "<br>")}
                                        </div>
                                    `
                                        : ""
                                    }
                                    ${
                                      notification.actionText
                                        ? `
                                        <div class="notification-action">
                                            <button class="btn-notification-action" onclick="handleNotificationAction('${notification.id}')">
                                                <i class="fas fa-arrow-right me-1"></i>${notification.actionText}
                                            </button>
                                        </div>
                                    `
                                        : ""
                                    }
                                </div>
                                ${
                                  !notification.isRead
                                    ? '<div class="unread-indicator"></div>'
                                    : ""
                                }
                            </li>
                        `;

      const item = $(notificationHtml);

      item.on("click", function (e) {
        if (!$(e.target).hasClass("btn-notification-action")) {
          if (!notification.isRead) {
            notification.isRead = true;
            $(this).removeClass("unread").find(".unread-indicator").remove();
            updateNotificationBadge(
              notifications.filter((n) => !n.isRead).length
            );
          }
        }
      });

      container.append(item);
    });
  }

  // Handle notification action clicks
  window.handleNotificationAction = function (notificationId) {
    const notification = currentNotifications.find(
      (n) => n.id === notificationId
    );
    if (notification && notification.actionFunction) {
      notification.actionFunction();   // Call the functions , assosiate with that notification
    }
  };

  // =================== ENHANCED MODAL FUNCTIONS ===================

  function showRejectionDetails(applicationId, reason) {
    console.log(
      "Showing rejection details for app",
      applicationId,
      "with reason:",
      reason
    );

    Swal.fire({
      title: "❌ Application Rejected",
      html: `
                <div class="rejection-modal-content">
                    <div class="rejection-header">
                        <div class="rejection-icon-container">
                            <i class="fas fa-times-circle rejection-icon"></i>
                        </div>
                        <h5>Application #${applicationId}</h5>
                        <p class="text-muted">Don't worry - this is just a temporary setback!</p>
                    </div>
                    
                    <div class="rejection-reason-section">
                        <h6><i class="fas fa-info-circle me-2"></i>Reason for Rejection</h6>
                        <div class="reason-box">
                            ${
                              reason ||
                              "No specific reason provided. Please contact support for more details."
                            }
                        </div>
                    </div>
                    
                    <div class="next-steps-section">
                        <h6><i class="fas fa-route me-2"></i>Your Next Steps</h6>
                        <div class="steps-list">
                            <div class="step-item">
                                <div class="step-number">1</div>
                                <div class="step-content">
                                    <strong>Review the reason</strong>
                                    <p>Understand what needs to be corrected</p>
                                </div>
                            </div>
                            <div class="step-item">
                                <div class="step-number">2</div>
                                <div class="step-content">
                                    <strong>Gather correct documents</strong>
                                    <p>Prepare all required documents properly</p>
                                </div>
                            </div>
                            <div class="step-item">
                                <div class="step-number">3</div>
                                <div class="step-content">
                                    <strong>Submit new application</strong>
                                    <p>Double-check everything before submitting</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="encouragement-section">
                        <i class="fas fa-heart text-danger me-2"></i>
                        <span>Don't give up! Many successful drivers had their applications rejected initially. Learn from this and come back stronger!</span>
                    </div>
                </div>
                
                <style>
                    .rejection-modal-content { text-align: left; }
                    .rejection-header { text-align: center; margin-bottom: 25px; }
                    .rejection-icon-container { margin-bottom: 15px; }
                    .rejection-icon { font-size: 4rem; color: #dc3545; animation: shake 0.5s; }
                    @keyframes shake {
                        0%, 100% { transform: translateX(0); }
                        25% { transform: translateX(-5px); }
                        75% { transform: translateX(5px); }
                    }
                    .rejection-reason-section, .next-steps-section { margin-bottom: 20px; }
                    .rejection-reason-section h6, .next-steps-section h6 { 
                        color: #495057; margin-bottom: 10px; font-weight: 600; 
                    }
                    .reason-box {
                        background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
                        color: #721c24; padding: 15px; border-radius: 8px;
                        border-left: 4px solid #dc3545; font-weight: 500;
                    }
                    .steps-list { background: #f8f9fa; padding: 20px; border-radius: 10px; }
                    .step-item {
                        display: flex; align-items: flex-start; margin-bottom: 15px;
                    }
                    .step-item:last-child { margin-bottom: 0; }
                    .step-number {
                        width: 30px; height: 30px; background: #007bff; color: white;
                        border-radius: 50%; display: flex; align-items: center;
                        justify-content: center; font-weight: bold; margin-right: 15px;
                        flex-shrink: 0;
                    }
                    .step-content strong { display: block; margin-bottom: 2px; }
                    .step-content p { margin: 0; color: #6c757d; font-size: 0.9rem; }
                    .encouragement-section {
                        background: linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%);
                        padding: 15px; border-radius: 8px; text-align: center;
                        color: #155724; font-weight: 500;
                    }
                </style>
            `,
      showCancelButton: true,
      confirmButtonText:
        '<i class="fas fa-plus me-2"></i>Submit New Application',
      cancelButtonText: '<i class="fas fa-times me-2"></i>Close',
      confirmButtonColor: "#28a745",
      cancelButtonColor: "#6c757d",
      width: "600px",
    }).then((result) => {
      if (result.isConfirmed) {
        showLicenseForm();
      }
    });
  }

  async function showExamDetails(examDetails) {

    const examDate = new Date(examDetails.writtenExamDate);
    const isUpcoming = examDate > new Date();
    const daysUntilExam = Math.ceil(
        (examDate - new Date()) / (1000 * 60 * 60 * 24)
    );

    let trialExamData = [];
    let hasTrialExams = false;
    let latestTrialExam = null;
    let hasPassedTrial = false;

    if (examDetails.writtenExamResult === "PASS") {
        try {
            trialExamData = await getTrialExamDetails(examDetails.id);
            hasTrialExams = trialExamData && trialExamData.length > 0;
            
            if (hasTrialExams) {

              latestTrialExam = trialExamData.reduce((latest, current) => {
                    return new Date(current.trialDate) > new Date(latest.trialDate) ? current : latest;
                }, trialExamData[0]);
                
                hasPassedTrial = latestTrialExam && latestTrialExam.trialResult === "PASS";
            }
        } catch (error) {
            console.error('Error fetching trial exam data:', error);
        }
    }

    const isComplete = examDetails.writtenExamResult === "PASS" && hasPassedTrial;

    Swal.fire({
        title: `📝 Written Exam Details ${isComplete ? '✅ COMPLETE' : ''}`,
        html: `
            <div class="exam-details-modal">
                ${isComplete ? `
                    <div class="completion-banner">
                        <i class="fas fa-trophy me-2"></i>
                        <strong>License Process Complete!</strong>
                        <p>You have successfully passed both written and trial exams.</p>
                    </div>
                ` : ''}
                
                <div class="exam-status-banner ${isUpcoming ? "upcoming" : "past"}">
                    <i class="fas fa-${isUpcoming ? "calendar-check" : "history"} me-2"></i>
                    ${isUpcoming
                        ? `Exam in ${daysUntilExam} day${daysUntilExam !== 1 ? "s" : ""}`
                        : "Past Exam"
                    }
                </div>
                
                <div class="exam-info-grid">
                    <div class="exam-info-card">
                        <div class="exam-info-icon date-icon">
                            <i class="fas fa-calendar-alt"></i>
                        </div>
                        <div class="exam-info-content">
                            <label>Exam Date</label>
                            <strong>${formatDate(examDetails.writtenExamDate)}</strong>
                        </div>
                    </div>
                    
                    <div class="exam-info-card">
                        <div class="exam-info-icon time-icon">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="exam-info-content">
                            <label>Time</label>
                            <strong>${examDetails.writtenExamTime || "To be announced"}</strong>
                        </div>
                    </div>
                    
                    <div class="exam-info-card full-width">
                        <div class="exam-info-icon location-icon">
                            <i class="fas fa-map-marker-alt"></i>
                        </div>
                        <div class="exam-info-content">
                            <label>Location</label>
                            <strong>${examDetails.writtenExamLocation || "Will be announced soon"}</strong>
                        </div>
                    </div>
                    
                    ${examDetails.writtenExamResult ? `
                        <div class="exam-info-card full-width result-card">
                            <div class="exam-info-icon result-icon ${examDetails.writtenExamResult.toLowerCase()}">
                                <i class="fas fa-${examDetails.writtenExamResult === "PASS"
                                    ? "trophy"
                                    : examDetails.writtenExamResult === "FAIL" || examDetails.writtenExamResult === "ABSANT"
                                    ? "times"
                                    : "clock"
                                }"></i>
                            </div>
                            <div class="exam-info-content">
                                <label>Written Exam Result</label>
                                <strong class="result-text ${examDetails.writtenExamResult.toLowerCase()}">${examDetails.writtenExamResult}</strong>
                                ${examDetails.note ? `<p class="result-note">${examDetails.note}</p>` : ""}
                            </div>
                        </div>
                    ` : ""}
                </div>
                
                <!-- Trial Exam Information -->
                ${hasTrialExams ? `
                    <div class="trial-exam-section">
                        <h6><i class="fas fa-car me-2"></i>Trial Exam Details</h6>
                        <div class="trial-exam-info">
                            ${trialExamData.map(trialExam => `
                                <div class="trial-exam-card ${trialExam.trialResult === 'PASS' ? 'passed' : 'failed'}">
                                    <div class="trial-exam-header">
                                        <span class="trial-date">${formatDate(trialExam.trialDate)}</span>
                                        <span class="trial-result ${trialExam.trialResult.toLowerCase()}">${trialExam.trialResult}</span>
                                    </div>
                                    <div class="trial-exam-details">
                                        <div class="trial-time">
                                            <i class="fas fa-clock me-1"></i>
                                            ${trialExam.trialTime || 'Not specified'}
                                        </div>
                                        <div class="trial-location">
                                            <i class="fas fa-map-marker-alt me-1"></i>
                                            ${trialExam.trialLocation || 'Location not specified'}
                                        </div>
                                        ${trialExam.examinerName ? `
                                            <div class="trial-examiner">
                                                <i class="fas fa-user-tie me-1"></i>
                                                Examiner: ${trialExam.examinerName}
                                            </div>
                                        ` : ''}
                                        ${trialExam.examinerNotes ? `
                                            <div class="trial-notes">
                                                <i class="fas fa-sticky-note me-1"></i>
                                                ${trialExam.examinerNotes}
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        
                        ${!hasPassedTrial ? `
                            <div class="retry-message mt-3">
                                <i class="fas fa-redo text-info me-2"></i>
                                <span>You can apply for another trial exam. Contact the administration for more details.</span>
                            </div>
                        ` : `
                            <div class="success-message mt-3">
                                <i class="fas fa-check-circle text-success me-2"></i>
                                <span>Congratulations! You have successfully completed your trial exam.</span>
                            </div>
                        `}
                    </div>
                ` : examDetails.writtenExamResult === "PASS" ? `
                    <div class="trial-application-section">
                        <h6><i class="fas fa-car me-2"></i>Trial Exam</h6>
                        <p>You've passed the written exam! You can now apply for your trial exam.</p>
                        <button class="btn btn-primary btn-sm apply-trial-btn" onclick="applyForTrialExam(${examDetails.id , examDetails.trialDate})">
                            <i class="fas fa-paper-plane me-1"></i> Apply for Trial Exam
                        </button>
                    </div>
                ` : ''}
                
                ${isUpcoming ? `
                    <div class="exam-preparation-section">
                        <h6><i class="fas fa-graduation-cap me-2"></i>Exam Preparation Checklist</h6>
                        <div class="preparation-checklist">
                            <div class="checklist-item">
                                <i class="fas fa-check-circle me-2"></i>
                                <span>Study traffic rules and road signs</span>
                            </div>
                            <div class="checklist-item">
                                <i class="fas fa-check-circle me-2"></i>
                                <span>Review your license type requirements</span>
                            </div>
                            <div class="checklist-item">
                                <i class="fas fa-check-circle me-2"></i>
                                <span>Take practice tests online</span>
                            </div>
                            <div class="checklist-item">
                                <i class="fas fa-check-circle me-2"></i>
                                <span>Bring NIC and application receipt</span>
                            </div>
                            <div class="checklist-item">
                                <i class="fas fa-check-circle me-2"></i>
                                <span>Arrive 30 minutes early</span>
                            </div>
                        </div>
                    </div>
                    
                    ${daysUntilExam <= 7 ? `
                        <div class="exam-reminder-section">
                            <i class="fas fa-bell text-warning me-2"></i>
                            <strong>Important Reminder:</strong> Your exam is coming up soon! Make sure you're well-prepared and well-rested.
                        </div>
                    ` : ""}
                ` : ""}
                
                ${examDetails.writtenExamResult === "FAIL" || examDetails.writtenExamResult === "ABSANT" ? `
                    <div class="retry-message">
                        <i class="fas fa-redo text-info me-2"></i>
                        <span>Don't worry! You can retake the exam. Use this as a learning experience.</span>
                    </div>
                ` : ""}
            </div>
            
            <style>
                .exam-details-modal { text-align: left; }
                
                .completion-banner {
                    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                    color: white; text-align: center; padding: 20px;
                    border-radius: 10px; margin-bottom: 20px;
                    box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
                }
                .completion-banner i { font-size: 1.5rem; }
                .completion-banner p { margin: 5px 0 0 0; opacity: 0.9; }
                
                .exam-status-banner {
                    text-align: center; padding: 15px; border-radius: 10px;
                    margin-bottom: 20px; font-weight: 600; font-size: 1.1rem;
                }
                .exam-status-banner.upcoming {
                    background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
                    color: #155724;
                }
                .exam-status-banner.past {
                    background: linear-gradient(135deg, #e2e3e5 0%, #d6d8db 100%);
                    color: #383d41;
                }
                .exam-info-grid {
                    display: grid; grid-template-columns: 1fr 1fr; gap: 15px;
                    margin-bottom: 20px;
                }
                .exam-info-card {
                    display: flex; align-items: center; background: #f8f9fa;
                    padding: 20px; border-radius: 10px; border-left: 3px solid #007bff;
                }
                .exam-info-card.full-width { grid-column: 1 / -1; }
                .exam-info-card.result-card { border-left-color: #28a745; }
                .exam-info-icon {
                    width: 50px; height: 50px; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    margin-right: 15px; color: white; font-size: 1.2rem;
                }
                .date-icon { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
                .time-icon { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
                .location-icon { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
                .result-icon.pass { background: #28a745; }
                .result-icon.fail { background: #dc3545; }
                .result-icon.pending { background: #ffc107; }
                .exam-info-content label {
                    display: block; font-size: 0.85rem; color: #6c757d;
                    font-weight: 500; margin-bottom: 2px;
                }
                .exam-info-content strong { color: #495057; }
                .result-text.pass { color: #28a745; }
                .result-text.fail { color: #dc3545; }
                .result-text.pending { color: #856404; }
                .result-note { margin: 8px 0 0 0; font-size: 0.9rem; color: #6c757d; }
                
                /* Trial Exam Styles */
                .trial-exam-section {
                    background: #f8f9fa; padding: 20px; border-radius: 10px; 
                    margin-bottom: 15px; border-left: 4px solid #17a2b8;
                }
                .trial-exam-section h6 { color: #17a2b8; margin-bottom: 15px; }
                .trial-exam-card {
                    background: white; padding: 15px; border-radius: 8px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin-bottom: 10px;
                }
                .trial-exam-card.passed { border-left: 4px solid #28a745; }
                .trial-exam-card.failed { border-left: 4px solid #dc3545; }
                .trial-exam-header {
                    display: flex; justify-content: space-between;
                    align-items: center; margin-bottom: 10px;
                }
                .trial-date { font-weight: 600; color: #495057; }
                .trial-result {
                    padding: 4px 10px; border-radius: 20px; font-size: 0.8rem;
                    font-weight: 600;
                }
                .trial-result.pass { background: #d4edda; color: #155724; }
                .trial-result.fail { background: #f8d7da; color: #721c24; }
                .trial-exam-details > div { margin-bottom: 8px; }
                .trial-notes, .trial-examiner {
                    background: #f8f9fa; padding: 10px; border-radius: 5px;
                    margin-top: 10px; font-size: 0.9rem;
                }
                .trial-application-section {
                    background: #e3f2fd; padding: 20px; border-radius: 10px;
                    margin-bottom: 15px; text-align: center;
                }
                .trial-application-section h6 { color: #1565c0; }
                .apply-trial-btn { margin-top: 10px; }
                
                .exam-preparation-section {
                    background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
                    padding: 20px; border-radius: 10px; margin-bottom: 15px;
                }
                .exam-preparation-section h6 { color: #1565c0; margin-bottom: 15px; }
                .preparation-checklist { }
                .checklist-item {
                    display: flex; align-items: center; margin-bottom: 8px;
                    color: #1976d2;
                }
                .exam-reminder-section, .success-message, .retry-message {
                    padding: 15px; border-radius: 8px; text-align: center;
                    margin-bottom: 10px;
                }
                .exam-reminder-section {
                    background: #fff3cd; color: #856404;
                }
                .success-message {
                    background: #d4edda; color: #155724;
                }
                .retry-message {
                    background: #cce7ff; color: #0c5460;
                }
                .mt-3 { margin-top: 15px; }
            </style>
        `,
        confirmButtonText: '<i class="fas fa-times me-2"></i>Close',
        confirmButtonColor: "#007bff",
        width: "700px",
    });
  }

  window.applyForTrialExam = function(writtenExamId , trialDate) {
    Swal.fire({
        title: 'Apply for Trial Exam',
        html: `
            <div class="trial-application-form">
                <p>You are applying for a practical driving test (trial exam). Please confirm your details:</p>
                <div class="application-details">
                    <p><strong>Written Exam ID:</strong> ${writtenExamId}</p>
                    <p><strong>Driver:</strong> ${currentDriverName}</p>
                   <!-- <p><strong>Trial Date:</strong> ${trialDate}</p> -->
                </div>
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    Your trial exam will be scheduled after administrative review. You will be notified of the date and time.
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-paper-plane me-2"></i>Apply Now',
        cancelButtonText: '<i class="fas fa-times me-2"></i>Cancel',
        confirmButtonColor: "#28a745",
        preConfirm: () => {
            return submitTrialExamApplication(writtenExamId);
        }
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire(
                'Application Submitted!',
                'Your trial exam application has been submitted successfully. You will be notified once it is scheduled.',
                'success'
            );
        }
    });
  };

  function submitTrialExamApplication(writtenExamId) {
    return $.ajax({
        url: `${API_BASE_URL}/trial-exams/apply`,
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({
            writtenExamId: writtenExamId,
            driverId: currentDriverId
        })
    });
  }


  // =================== ENHANCED PAYMENT SYSTEM ===================

  window.showPaymentForm = function () {
    showLoading(true);

    loadDriverApplications()
      .then(() => {
        showLoading(false);

        const approvedApps = currentApplications.filter(
          (app) => app.status === "APPROVED"
        );

        if (approvedApps.length === 0) {
          handleNoPaymentAvailable();
          return;
        }

        showEnhancedPaymentModal(approvedApps);
      })
      .catch((error) => {
        showLoading(false);
        showAlert("Error", "Failed to load applications for payment.", "error");
      });
  };

  function handleNoPaymentAvailable() {
    
    const pendingApps = currentApplications.filter(
      (app) => app.status === "PENDING"
    );
    
    const rejectedApps = currentApplications.filter(
      (app) => app.status === "REJECTED"
    );

    let message,
      type,
      showApplyButton = false;

    if (pendingApps.length > 0) {
      message =
        "Your application is still under review. Payment will be available once approved.";
      type = "info";
    } else if (rejectedApps.length > 0) {
      message =
        "Your application was rejected. Please submit a new application first.";
      type = "warning";
      showApplyButton = true;
    } else {
      message =
        "You don't have any applications yet. Please submit an application first.";
      type = "info";
      showApplyButton = true;
    }

    Swal.fire({
      title: "💳 Payment Not Available",
      text: message,
      icon: type,
      showCancelButton: showApplyButton,
      cancelButtonText: showApplyButton
        ? '<i class="fas fa-plus me-2"></i>Submit Application'
        : null,
      confirmButtonText: '<i class="fas fa-times me-2"></i>Close',
      cancelButtonColor: "#28a745",
      confirmButtonColor: "#6c757d",
    }).then((result) => {
      if (result.dismiss === Swal.DismissReason.cancel && showApplyButton) {
        showLicenseForm();
      }
    });
  }

  async function showEnhancedPaymentModal(applications) {
  const applicationsList = await Promise.all(
    applications.map(async (app) => {
      const vehicleClasses = app.vehicleClasses
        ? Array.isArray(app.vehicleClasses)
          ? app.vehicleClasses.join(", ")
          : app.vehicleClasses
        : "N/A";
      
      let examFee = 3000;
      try {
        const feeResponse = await fetch(`${API_BASE_URL}/payment/calculate-fee?licenseType=${app.licenseType}&vehicleClasses=${app.vehicleClasses || ''}`, {
          method: 'GET',
          headers: {
            Authorization: "Bearer " + (localStorage.getItem("smartreg_token") || sessionStorage.getItem("smartreg_token")),
            'Content-Type': 'application/json'
          }
        });
        
        if (feeResponse.ok) {
          const feeData = await feeResponse.json();
          if (feeData.status === 200) {
            examFee = feeData.data.examFee;
          }
        }
      } catch (error) {
        console.error('Error fetching exam fee:', error);
      }

      let examInfo = "";
      try {
        const examDetails = await getWrittenExamDetails(app.id);
        if (examDetails) {
          examInfo = `
            <div class="exam-info-mini">
                <i class="fas fa-calendar me-1"></i>${formatDate(examDetails.writtenExamDate)} 
                <i class="fas fa-clock ms-2 me-1"></i>${examDetails.writtenExamTime || "TBA"}
                ${examDetails.examLocation ? `<br><i class="fas fa-map-marker-alt me-1"></i>${examDetails.examLocation}` : ""}
            </div>
          `;
        }
      } catch (error) {
        console.log("No exam details for app:", app.id);
      }

      return `
        <div class="payment-application-card" data-id="${app.id}">
            <input type="radio" name="paymentApplication" value="${app.id}" id="app_${app.id}" class="payment-radio">
            <label for="app_${app.id}" class="payment-card-label">
                <div class="payment-card-header">
                    <div class="payment-app-info">
                        <div class="payment-app-title">
                            <i class="fas fa-file-alt me-2"></i>
                            <strong>Application #${app.id}</strong>
                            <span class="badge bg-success ms-2">APPROVED</span>
                        </div>
                        <div class="payment-app-details">
                            <div class="detail-row">
                                <i class="fas fa-certificate me-2"></i>
                                <span>${app.licenseType.toUpperCase()} License</span>
                            </div>
                            <div class="detail-row">
                                <i class="fas fa-car me-2"></i>
                                <span>Classes: ${vehicleClasses}</span>
                            </div>
                            ${examInfo}
                        </div>
                    </div>
                    <div class="payment-amount-section">
                        <div class="amount-display">
                            <div class="currency">Rs.</div>
                            <div class="amount">${examFee.toLocaleString()}</div>
                        </div>
                        <div class="amount-label">Exam Fee</div>
                    </div>
                </div>
            </label>
        </div>
      `;
    })
  );

  Swal.fire({
    title: '<i class="fas fa-credit-card me-2"></i>Exam Fee Payment',
    html: `
      <div class="enhanced-payment-modal">
          <div class="payment-intro-banner">
              <i class="fas fa-shield-alt me-2"></i>
              <span>Secure payment for your approved applications</span>
          </div>
          
          <div class="applications-section">
              <h6 class="section-title">
                  <i class="fas fa-file-invoice me-2"></i>Select Application to Pay:
              </h6>
              <div class="applications-container">
                  ${applicationsList.join("")}
              </div>
          </div>
          
          <div class="payment-methods-section">
              <h6 class="section-title">
                  <i class="fas fa-credit-card me-2"></i>Choose Payment Method:
              </h6>
              <div class="payment-methods-grid">
                  <div class="payment-method-option">
                      <input type="radio" name="paymentMethod" id="card" value="CARD" class="method-radio" checked>
                      <label for="card" class="method-label">
                          <div class="method-icon card-gradient">
                              <i class="fas fa-credit-card"></i>
                          </div>
                          <div class="method-info">
                              <strong>Credit/Debit Card</strong>
                              <small>Visa • MasterCard • American Express</small>
                          </div>
                          <div class="method-indicator">
                              <i class="fas fa-check-circle"></i>
                          </div>
                      </label>
                  </div>
                  
                  <div class="payment-method-option">
                      <input type="radio" name="paymentMethod" id="bank" value="BANK" class="method-radio">
                      <label for="bank" class="method-label">
                          <div class="method-icon bank-gradient">
                              <i class="fas fa-university"></i>
                          </div>
                          <div class="method-info">
                              <strong>Bank Transfer</strong>
                              <small>Direct online banking</small>
                          </div>
                          <div class="method-indicator">
                              <i class="fas fa-check-circle"></i>
                          </div>
                      </label>
                  </div>
                  
                  <div class="payment-method-option">
                      <input type="radio" name="paymentMethod" id="mobile" value="MOBILE" class="method-radio">
                      <label for="mobile" class="method-label">
                          <div class="method-icon mobile-gradient">
                              <i class="fas fa-mobile-alt"></i>
                          </div>
                          <div class="method-info">
                              <strong>Mobile Payment</strong>
                              <small>eZ Cash • mCash • Frimi</small>
                          </div>
                          <div class="method-indicator">
                              <i class="fas fa-check-circle"></i>
                          </div>
                      </label>
                  </div>
              </div>
          </div>
          
          <div class="payment-security-footer">
              <i class="fas fa-lock me-2"></i>
              <span>256-bit SSL encryption • PCI DSS compliant • Your data is safe</span>
          </div>
      </div>
      
      <style>
          .enhanced-payment-modal { text-align: left; }
          .payment-intro-banner {
              background: linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%);
              color: #155724; padding: 12px 20px; border-radius: 10px;
              text-align: center; margin-bottom: 25px; font-weight: 500;
          }
          .section-title {
              color: #495057; font-weight: 600; margin-bottom: 15px;
              padding-bottom: 8px; border-bottom: 2px solid #e9ecef;
          }
          .applications-section { margin-bottom: 25px; }
          .applications-container { max-height: 400px; overflow-y: auto; }
          .payment-application-card {
              border: 2px solid #e9ecef; border-radius: 12px;
              margin-bottom: 15px; transition: all 0.3s ease;
              background: #f8f9fa; overflow: hidden;
          }
          .payment-application-card:hover {
              border-color: #007bff; box-shadow: 0 4px 12px rgba(0,123,255,0.15);
          }
          .payment-radio { position: absolute; opacity: 0; }
          .payment-radio:checked + .payment-card-label {
              background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
              border: 2px solid #007bff;
          }
          .payment-card-label {
              display: block; padding: 20px; cursor: pointer;
              border: 2px solid transparent; border-radius: 10px;
              transition: all 0.3s ease;
          }
          .payment-card-header {
              display: flex; justify-content: space-between; align-items: center;
          }
          .payment-app-title {
              display: flex; align-items: center; margin-bottom: 12px;
          }
          .payment-app-details { }
          .detail-row {
              display: flex; align-items: center; margin-bottom: 6px;
              color: #6c757d; font-size: 0.9rem;
          }
          .exam-info-mini {
              margin-top: 8px; padding: 8px; background: rgba(0,123,255,0.1);
              border-radius: 6px; font-size: 0.85rem; color: #0056b3;
          }
          .payment-amount-section { text-align: right; }
          .amount-display {
              display: flex; align-items: baseline; justify-content: flex-end;
              margin-bottom: 5px;
          }
          .currency {
              font-size: 1rem; font-weight: 500; color: #28a745;
              margin-right: 4px;
          }
          .amount {
              font-size: 1.8rem; font-weight: bold; color: #28a745;
          }
          .amount-label {
              font-size: 0.8rem; color: #6c757d; font-weight: 500;
          }
          .payment-methods-section { margin-bottom: 20px; }
          .payment-methods-grid {
              display: grid; grid-template-columns: 1fr;
              gap: 12px;
          }
          .payment-method-option { position: relative; }
          .method-radio { position: absolute; opacity: 0; }
          .method-radio:checked + .method-label {
              border-color: #007bff;
              background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
          }
          .method-radio:checked + .method-label .method-indicator {
              color: #007bff;
          }
          .method-label {
              display: flex; align-items: center; padding: 15px;
              border: 2px solid #e9ecef; border-radius: 10px;
              cursor: pointer; transition: all 0.3s ease;
              background: #f8f9fa;
          }
          .method-label:hover {
              border-color: #007bff; box-shadow: 0 2px 8px rgba(0,123,255,0.1);
          }
          .method-icon {
              width: 50px; height: 50px; border-radius: 12px;
              display: flex; align-items: center; justify-content: center;
              margin-right: 15px; color: white; font-size: 1.3rem;
          }
          .card-gradient { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
          .bank-gradient { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
          .mobile-gradient { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
          .method-info { flex: 1; }
          .method-info strong { display: block; margin-bottom: 3px; }
          .method-info small { color: #6c757d; }
          .method-indicator {
              font-size: 1.2rem; color: #e9ecef; transition: color 0.3s ease;
          }
          .payment-security-footer {
              background: #f8f9fa; padding: 12px 20px; border-radius: 8px;
              text-align: center; color: #6c757d; font-size: 0.9rem;
              border: 1px solid #e9ecef;
          }
          @media (max-width: 768px) {
              .payment-card-header { flex-direction: column; text-align: center; }
              .payment-amount-section { margin-top: 15px; text-align: center; }
          }
      </style>
    `,
    showCancelButton: true,
    confirmButtonText: '<i class="fas fa-lock me-2"></i>Proceed to Secure Payment',
    cancelButtonText: '<i class="fas fa-times me-2"></i>Cancel',
    confirmButtonColor: "#28a745",
    cancelButtonColor: "#6c757d",
    width: "900px",
    preConfirm: () => {
      const selectedApp = $('input[name="paymentApplication"]:checked').val();
      const paymentMethod = $('input[name="paymentMethod"]:checked').val();

      if (!selectedApp) {
        Swal.showValidationMessage("Please select an application to pay for");
        return false;
      }

      return { applicationId: selectedApp, method: paymentMethod };
    },
  }).then((result) => {
    if (result.isConfirmed) {
      processEnhancedPayment(result.value);
    }
  });
  }

  function checkPayHereLoaded() {
  return new Promise((resolve) => {
    if (typeof payhere !== 'undefined') {
      resolve(true);
      return;
    }
    
    let attempts = 0;
    const maxAttempts = 10;
    
    const checkInterval = setInterval(() => {
      attempts++;
      if (typeof payhere !== 'undefined') {
        clearInterval(checkInterval);
        resolve(true);
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        resolve(false);
      }
    }, 500);
  });
  }

  async function processEnhancedPayment(paymentData) {
  
   const payhereLoaded = await checkPayHereLoaded();
    if (!payhereLoaded) {
      Swal.fire({
        title: 'Payment System Unavailable',
        html: `
          <div class="system-unavailable">
            <i class="fas fa-exclamation-circle text-danger mb-3" style="font-size: 3rem;"></i>
            <p>PayHere payment system could not be loaded.</p>
            <div class="troubleshooting">
              <h6>Possible solutions:</h6>
              <ul class="text-start">
                <li>Check your internet connection</li>
                <li>Disable ad blockers temporarily</li>
                <li>Try refreshing the page</li>
                <li>Clear browser cache</li>
              </ul>
            </div>
          </div>
          
          <style>
            .system-unavailable { text-align: center; }
            .troubleshooting { 
              background: #f8f9fa; padding: 15px; border-radius: 8px;
              margin-top: 20px; text-align: left; 
            }
            .troubleshooting h6 { color: #495057; margin-bottom: 10px; }
          </style>
        `,
      
        showCancelButton: true,
        confirmButtonText: 'Refresh Page',
        cancelButtonText: 'Close',
        confirmButtonColor: '#28a745'
      }).then((result) => {
        if (result.isConfirmed) {
          location.reload();
        }
      });
      
      return;
    }

    Swal.fire({
      title: "Initializing Payment...",
      html: `
        <div class="payment-initialization">
          <div class="init-progress">
            <div class="init-step active">
              <i class="fas fa-check-circle"></i>
              <span>Payment system loaded</span>
            </div>
            <div div class="init-step loading">
              <div class="init-spinner"></div>
              <span>Setting up secure connection</span>
            </div>
            <div class="init-step">
              <i class="fas fa-circle"></i>
              <span>Preparing payment form</span>
            </div>
          </div>
        </div>
      
        <style>
          .payment-initialization { text-align: left; }
          .init-progress { display: flex; flex-direction: column; gap: 15px; }
          .init-step { 
            display: flex; align-items: center; padding: 10px;
            background: #f8f9fa; border-radius: 8px; transition: all 0.3s;
          }
          .init-step.active { 
            background: #d4edda; color: #155724; 
          }
          .init-step.loading { 
            background: #fff3cd; color: #856404; 
          }
          .init-step i, .init-spinner { 
            margin-right: 12px; width: 20px; 
          }
          .init-spinner {
            border: 2px solid #f3f3f3; border-top: 2px solid #007bff;
            border-radius: 50%; animation: spin 1s linear infinite;
            height: 16px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `,
    
      allowOutsideClick: false,
      showConfirmButton: false,
    });

    Swal.fire({
      title: "Setting Up Payment...",
      html: `
        <div class="payment-setup">
          <div class="setup-spinner"></div>
          <p>Preparing secure payment form</p>
        </div>
      
        <style>
          .setup-spinner {
              width: 40px; height: 40px;
              border: 3px solid #f3f3f3;
              border-top: 3px solid #007bff;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin: 0 auto 15px auto;
          }
          @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
          }
        </style>
      `,
    
      allowOutsideClick: false,
      showConfirmButton: false,
    });

    try {
      const selectedApp = currentApplications.find(
        (app) => app.id == paymentData.applicationId
      );

      let writtenExamId = null;
      try {
        const examDetails = await getWrittenExamDetails(selectedApp.id);
        if (examDetails && examDetails.id) {
          writtenExamId = examDetails.id;
        }
      } catch (error) {
        console.log("No exam details found:", error);
      }

      const paymentRequest = {
        applicationId: parseInt(paymentData.applicationId),
        paymentMethod: paymentData.method.toUpperCase(),
        driverId: currentDriverId,
        driverName: currentDriverName,
        licenseType: selectedApp.licenseType || "",
        writtenExamId: writtenExamId
      };

      console.log("Sending payment request:", paymentRequest);

      const response = await fetch(`${API_BASE_URL}/payment/initialize`, {
        method: 'POST',
        headers: {
          Authorization: "Bearer " + (localStorage.getItem("smartreg_token") || sessionStorage.getItem("smartreg_token")),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentRequest)
      });

      console.log("Payment response status:", response.status);
    
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Payment response error:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const responseData = await response.json();
      console.log("Payment response data:", responseData);

      if (!responseData.data || !responseData.data.hash) {
        console.error("Invalid response structure:", responseData);
        throw new Error('Invalid response from payment service');
      }

      if (responseData.code !== 200) {
        throw new Error(responseData.message || 'Payment initialization failed');
      }

      const paymentDataBackend = responseData.data;
      console.log("Payment data from backend:", paymentDataBackend);
    
      if (!paymentDataBackend.hash || !paymentDataBackend.merchantId || !paymentDataBackend.payhereOrderId) {
        console.error("Missing required fields in payment data:", paymentDataBackend);
        throw new Error('Missing required payment configuration');
      }
    
      setTimeout(() => {
        showPayHerePaymentForm(paymentDataBackend);
      }, 1500);

    } catch (error) {
      console.error('Payment setup error:', error);
      Swal.fire({
        title: 'Payment Setup Failed',
        text: error.message || 'Could not initialize payment. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  }

  function showPayHerePaymentForm(paymentData) {
    Swal.close();

    const nameParts = currentDriverName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    Swal.fire({
      title: 'Secure Payment',
      html: `
        <div class="payhere-form-container">
          <div class="payment-header">
              <i class="fas fa-shield-alt text-success"></i>
              <h5>PayHere Secure Payment</h5>
              <p>Your payment is protected by industry-standard encryption</p>
          </div>
          
          <div class="payment-details">
              <div class="detail-card">
                  <div class="card-title">Payment Summary</div>
                  <div class="detail-item">
                      <span>Application ID:</span>
                      <strong>#${paymentData.paymentId}</strong>
                  </div>
                  <div class="detail-item">
                      <span>Payment For:</span>
                      <strong>Driving License Exam</strong>
                  </div>
                  <div class="detail-item">
                      <span>Applicant:</span>
                      <strong>${currentDriverName}</strong>
                  </div>
                  <div class="detail-item total">
                      <span>Total Amount:</span>
                      <strong>Rs. ${paymentData.amount.toLocaleString()}</strong>
                  </div>
              </div>
          </div>
          
          <div class="payment-info">
              <div class="info-item">
                  <i class="fas fa-check-circle text-success"></i>
                  <span>SSL Encrypted</span>
              </div>
              <div class="info-item">
                  <i class="fas fa-credit-card text-primary"></i>
                  <span>All Cards Accepted</span>
              </div>
              <div class="info-item">
                  <i class="fas fa-mobile-alt text-info"></i>
                  <span>Mobile Payments</span>
              </div>
          </div>
        </div>
      
        <style>
          .payhere-form-container { text-align: center; }
          .payment-header {
              margin-bottom: 25px;
          }
          .payment-header i {
              font-size: 2rem;
              margin-bottom: 10px;
          }
          .payment-header h5 {
              color: #495057;
              margin-bottom: 5px;
          }
          .payment-header p {
              color: #6c757d;
              font-size: 0.9rem;
          }
          .detail-card {
              background: #f8f9fa;
              border-radius: 10px;
              padding: 20px;
              margin-bottom: 20px;
              text-align: left;
          }
          .card-title {
              font-weight: 600;
              margin-bottom: 15px;
              color: #495057;
              text-align: center;
          }
          .detail-item {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #e9ecef;
          }
          .detail-item.total {
              border-bottom: none;
              border-top: 2px solid #007bff;
              margin-top: 10px;
              padding-top: 15px;
              font-size: 1.1rem;
              color: #007bff;
          }
          .payment-info {
              display: flex;
              justify-content: space-around;
              margin-top: 20px;
          }
          .info-item {
              display: flex;
              flex-direction: column;
              align-items: center;
              font-size: 0.8rem;
          }
          .info-item i {
              margin-bottom: 5px;
          }
        </style>
      `,
      showCancelButton: true,
      confirmButtonText: '<i class="fas fa-credit-card me-2"></i>Pay Securely',
      cancelButtonText: '<i class="fas fa-times me-2"></i>Cancel',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      allowOutsideClick: false,
      width: '500px'
    
    }).then((result) => {
      if (result.isConfirmed) {
        executePayHerePayment(paymentData, firstName, lastName);
      }
    });
  }

  function executePayHerePayment(paymentData, firstName, lastName) {
  
    console.log("=== PayHere Payment Debug ===");
    console.log("Payment data received:", paymentData);
    console.log("First name:", firstName);
    console.log("Last name:", lastName);
  
    const requiredFields = ['hash', 'merchantId', 'payhereOrderId', 'amount', 'transactionId'];
    const missingFields = requiredFields.filter(field => !paymentData[field]);
  
    if (missingFields.length > 0) {
      console.error("Missing required payment fields:", missingFields);
      Swal.fire({
        title: 'Payment Configuration Error',
        html: `
          <div class="error-details">
            <p>Payment setup incomplete. Missing:</p>
            <ul>${missingFields.map(field => `<li>${field}</li>`).join('')}</ul>
          </div>
        `,
      
        icon: 'error',
        confirmButtonText: 'Try Again'
      });
  
      return;
    }

    if (typeof payhere === 'undefined') {
      console.error("PayHere library not loaded");
      Swal.fire({
        title: 'Payment System Error',
        text: 'PayHere payment system not available. Please refresh and try again.',
        icon: 'error',
        confirmButtonText: 'Refresh'
    
      }).then(() => location.reload());
      
      return;
    }

    const payment = {
      "sandbox": true,
      "merchant_id": paymentData.merchantId,
      "return_url": paymentData.returnUrl || `${window.location.origin}/payment/success`,
      "cancel_url": paymentData.cancelUrl || `${window.location.origin}/payment/cancel`,
      "notify_url": paymentData.notifyUrl || `${API_BASE_URL}/payment/callback`,
      "order_id": paymentData.payhereOrderId,
      "items": `Driving License Exam Fee - Application #${paymentData.paymentId}`,
      "amount": parseFloat(paymentData.amount).toFixed(2),
      "currency": paymentData.currency || "LKR",
      "hash": paymentData.hash,
      "first_name": firstName || "Customer",
      "last_name": lastName || "User",
      "email": "anjanaheshan676@gmail.com",
      "phone": "0764810851",
      "address": "Colombo",
      "city": "Colombo",
      "country": "Sri Lanka",
      "custom_1": paymentData.transactionId,
      "custom_2": paymentData.paymentId?.toString() || paymentData.applicationId?.toString()
    };

    console.log("Final PayHere payment object:", payment);
    console.log("Hash from backend:", paymentData.hash);
    console.log("============================");

      payhere.onCompleted = function onCompleted(orderId) {
        console.log("Payment completed successfully! Order ID:", orderId);
        
        Swal.fire({
          title: 'Payment Processing...',
          html: `
            <div class="payment-processing">
              <div class="processing-spinner"></div>
              <p>Verifying your payment...</p>
              <p><strong>Order ID:</strong> ${orderId}</p>
            </div>
            <style>
              .processing-spinner {
                width: 40px; height: 40px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #28a745;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 15px;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            </style>
          `,
          allowOutsideClick: false,
          showConfirmButton: false,
          didOpen: () => {
            setTimeout(async () => {
              try {
                const authToken = localStorage.getItem("smartreg_token") || sessionStorage.getItem("smartreg_token");
                
                if (!authToken) {
                  throw new Error("Authentication token not found");
                }

                Swal.close();
                
                // Show success dialog with preview and download options
                Swal.fire({
                  icon: 'success',
                  title: 'Payment Successful!',
                  html: `<p>Your payment for <strong>Order ID: ${orderId}</strong> has been completed successfully.</p>`,
                  showCancelButton: true,
                  showDenyButton: true,
                  confirmButtonText: 'Preview Report',
                  denyButtonText: 'Download Report', 
                  cancelButtonText: 'Close',
                  confirmButtonColor: '#17a2b8',
                  denyButtonColor: '#28a745',
                  cancelButtonColor: '#6c757d'
                }).then(async (result) => {
                  if (result.isConfirmed) {
                    // Preview the report
                    await previewPaymentReport(authToken);
                  } else if (result.isDenied) {
                    // Download the report directly
                    await downloadPaymentReport(authToken);
                  }
                });

              } catch (error) {
                console.error("Error during payment verification:", error);
                Swal.close();
                
                Swal.fire({
                  icon: 'warning',
                  title: 'Payment Completed',
                  html: `
                    <p>Your payment has been processed, but we couldn't automatically verify it.</p>
                    <p><strong>Order ID:</strong> ${orderId}</p>
                    <p>You can view your report from the dashboard.</p>
                  `,
                  confirmButtonText: 'OK'
                });
              }
            }, 3000);
          }
        });
      };

      // Function to preview the report in a new tab
      async function previewPaymentReport(authToken) {
        const loadingAlert = Swal.fire({
          title: 'Loading Report Preview...',
          html: 'Please wait while we prepare your payment report.',
          allowOutsideClick: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        try {
          const reportResponse = await fetch(`${API_BASE_URL}/payment/report/success`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${authToken}`,
              "Accept": "application/pdf"
            }
          });

          if (!reportResponse.ok) {
            throw new Error(`HTTP error! status: ${reportResponse.status} - ${reportResponse.statusText}`);
          }

          const contentType = reportResponse.headers.get('content-type');
          if (!contentType || !contentType.includes('application/pdf')) {
            throw new Error('Invalid response format - expected PDF');
          }

          const blob = await reportResponse.blob();
          const url = window.URL.createObjectURL(blob);
          
          // Open in new tab for preview
          const previewWindow = window.open(url, '_blank');
          
          Swal.close();
          
          if (previewWindow) {
            // Show dialog asking if they want to download after preview
            setTimeout(() => {
              Swal.fire({
                icon: 'info',
                title: 'Report Preview Opened',
                html: 'Your payment report has been opened in a new tab. Would you like to download it as well?',
                showCancelButton: true,
                confirmButtonText: 'Download Report',
                cancelButtonText: 'No Thanks',
                confirmButtonColor: '#28a745',
                cancelButtonColor: '#6c757d'
              }).then((result) => {
                if (result.isConfirmed) {
                  // Create download link
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Payment_Report_${new Date().toISOString().split('T')[0]}.pdf`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  
                  Swal.fire({
                    icon: 'success',
                    title: 'Report Downloaded!',
                    text: 'Your payment report has been downloaded successfully.',
                    timer: 2000,
                    showConfirmButton: false
                  });
                }
                
                // Clean up URL after some time
                setTimeout(() => {
                  window.URL.revokeObjectURL(url);
                }, 5000);
              });
            }, 1000);
          } else {
            // If popup was blocked, show alternative
            Swal.fire({
              icon: 'warning',
              title: 'Preview Blocked',
              html: `
                <p>Your browser blocked the popup. Please allow popups for this site or click below to download the report.</p>
                <button id="downloadBtn" class="swal2-confirm swal2-styled" style="background-color: #28a745;">Download Report</button>
              `,
              showConfirmButton: false,
              didOpen: () => {
                document.getElementById('downloadBtn').onclick = () => {
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Payment_Report_${new Date().toISOString().split('T')[0]}.pdf`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  window.URL.revokeObjectURL(url);
                  
                  Swal.close();
                  Swal.fire({
                    icon: 'success',
                    title: 'Report Downloaded!',
                    timer: 2000,
                    showConfirmButton: false
                  });
                };
              }
            });
          }

        } catch (error) {
          console.error("Report preview error:", error);
          Swal.close();
          
          Swal.fire({
            icon: 'error',
            title: 'Preview Failed',
            html: `
              <p>We couldn't load the report preview at this time.</p>
              <p><strong>Error:</strong> ${error.message}</p>
              <p>Would you like to try downloading it instead?</p>
            `,
            showCancelButton: true,
            confirmButtonText: 'Download Report',
            cancelButtonText: 'Cancel'
          }).then((result) => {
            if (result.isConfirmed) {
              downloadPaymentReport(authToken);
            }
          });
        }
      }

      // Function to download the report directly
      async function downloadPaymentReport(authToken, retries = 3) {
        const loadingAlert = Swal.fire({
          title: 'Generating Report...',
          html: 'Please wait while we prepare your payment report.',
          allowOutsideClick: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        try {
          const reportResponse = await fetch(`${API_BASE_URL}/payment/report/success`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${authToken}`,
              "Accept": "application/pdf"
            }
          });

          if (!reportResponse.ok) {
            throw new Error(`HTTP error! status: ${reportResponse.status} - ${reportResponse.statusText}`);
          }

          const contentType = reportResponse.headers.get('content-type');
          if (!contentType || !contentType.includes('application/pdf')) {
            throw new Error('Invalid response format - expected PDF');
          }

          const blob = await reportResponse.blob();
          const url = window.URL.createObjectURL(blob);
          
          // Create download link
          const a = document.createElement('a');
          a.href = url;
          a.download = `Payment_Report_${new Date().toISOString().split('T')[0]}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          
          // Clean up
          window.URL.revokeObjectURL(url);
          
          Swal.close();
          
          Swal.fire({
            icon: 'success',
            title: 'Report Downloaded!',
            text: 'Your payment report has been downloaded successfully.',
            timer: 2000,
            showConfirmButton: false
          });

        } catch (error) {
          console.error("Report download error:", error);
          Swal.close();
          
          if (retries > 0) {
            console.log(`Retrying report download... (${retries} attempts left)`);
            setTimeout(() => {
              downloadPaymentReport(authToken, retries - 1);
            }, 2000);
            return;
          }

          Swal.fire({
            icon: 'error',
            title: 'Download Failed',
            html: `
              <p>We couldn't download your payment report at this time.</p>
              <p><strong>Error:</strong> ${error.message}</p>
              <p>Please try again later or contact support.</p>
            `,
            confirmButtonText: 'OK'
          });
        }
      }


    payhere.onDismissed = function onDismissed() {
      console.log("PayHere payment window dismissed");
      Swal.fire({
        title: 'Payment Cancelled',
        html: `
          <div class="payment-cancelled">
            <i class="fas fa-times-circle text-warning mb-3" style="font-size: 3rem;"></i>
            <p>Payment was cancelled or the window was closed.</p>
            <p>Your application is still saved and you can complete payment later.</p>
          </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Try Again',
        cancelButtonText: 'Close',
        confirmButtonColor: '#28a745'
      }).then((result) => {
        if (result.isConfirmed) {
          showPaymentForm();
        }
      });
    };

    payhere.onError = function onError(error) {
      console.error("PayHere payment error:", error);
      
      let errorMessage = 'Payment processing failed';
      let suggestions = [];
      
      if (typeof error === 'string') {
        if (error.includes('Invalid hash')) {
          errorMessage = 'Payment security validation failed';
          suggestions = ['Please try again', 'Contact support if issue persists'];
        } else if (error.includes('network')) {
          errorMessage = 'Network connection error';
          suggestions = ['Check your internet connection', 'Try again in a moment'];
        } else if (error.includes('card')) {
          errorMessage = 'Card processing error';
          suggestions = ['Verify your card details', 'Try a different card', 'Contact your bank'];
        }
      }
      
      Swal.fire({
        title: 'Payment Error',
        html: `
          <div class="payment-error-detailed">
            <i class="fas fa-exclamation-triangle text-danger mb-3" style="font-size: 3rem;"></i>
            <p><strong>${errorMessage}</strong></p>
            <p class="error-code">Error: ${error || 'Unknown error'}</p>
            
            ${suggestions.length > 0 ? `
              <div class="error-suggestions">
                <h6>Suggestions:</h6>
                <ul class="text-start">
                  ${suggestions.map(s => `<li>${s}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            
            <div class="support-info mt-3">
              <p><small>Need help? Contact: support@licensepro.lk</small></p>
            </div>
          </div>
          <style>
            .payment-error-detailed { text-align: center; }
            .error-code { 
              background: #f8f9fa; padding: 8px; border-radius: 4px; 
              font-family: monospace; color: #dc3545; margin: 15px 0;
            }
            .error-suggestions { 
              background: #fff3cd; padding: 15px; border-radius: 8px; 
              margin: 15px 0; 
            }
            .error-suggestions h6 { color: #856404; }
            .error-suggestions ul { margin: 0; }
            .support-info { color: #6c757d; }
          </style>
        `,
        showCancelButton: true,
        confirmButtonText: 'Try Again',
        cancelButtonText: 'Close',
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d'
      }).then((result) => {
        if (result.isConfirmed) {
          showPaymentForm();
        }
      });
    };

    try {
      console.log("Starting PayHere payment...");
      payhere.startPayment(payment);
    } catch (error) {
      console.error("Error starting PayHere payment:", error);
      Swal.fire({
        title: 'Payment Initialization Error',
        text: 'Could not start payment process. Please refresh the page and try again.',
        icon: 'error',
        confirmButtonText: 'Refresh Page'
      }).then(() => location.reload());
    }
  }


  function startEnhancedPaymentStatusMonitoring(transactionId) {
    const checkInterval = 4000;
    let checkCount = 0;
    const maxChecks = 45;
    let consecutiveFailures = 0;
    const maxFailures = 3;

    console.log(`Starting payment status monitoring for: ${transactionId}`);

    const statusInterval = setInterval(async () => {
      checkCount++;
      
      try {
        const response = await fetch(`${API_BASE_URL}/payment/status/${transactionId}`, {
          method: 'GET',
          headers: {
            Authorization: "Bearer " + (localStorage.getItem("smartreg_token") || sessionStorage.getItem("smartreg_token")),
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const statusData = await response.json();
        console.log(`Status check ${checkCount}:`, statusData);
        
        consecutiveFailures = 0;
        
        if (statusData.code === 200) {
          const paymentStatus = statusData.data.status;
          
          switch (paymentStatus) {
            case 'COMPLETED':
              clearInterval(statusInterval);
              showPaymentSuccessModal(statusData.data);
              return;
              
            case 'FAILED':
            case 'CANCELLED':
              clearInterval(statusInterval);
              showPaymentFailedModal(statusData.data);
              return;
              
            case 'PROCESSING':
            case 'PENDING':
              console.log(`Payment still ${paymentStatus.toLowerCase()}...`);
              break;
              
            default:
              console.warn(`Unknown payment status: ${paymentStatus}`);
          }
        }
      } catch (error) {
        consecutiveFailures++;
        console.error(`Status check ${checkCount} failed:`, error);
        
        if (consecutiveFailures >= maxFailures) {
          clearInterval(statusInterval);
          showPaymentMonitoringError(transactionId, error);
          return;
        }
      }

      if (checkCount >= maxChecks) {
        clearInterval(statusInterval);
        showPaymentTimeoutModal(transactionId);
      }
    }, checkInterval);

    Swal.fire({
      title: 'Verifying Payment...',
      html: `
        <div class="payment-verification">
          <div class="verification-animation">
            <div class="pulse-ring"></div>
            <div class="pulse-dot"></div>
          </div>
          <p>Please wait while we confirm your payment...</p>
          <div class="verification-details">
            <div class="detail-row">
              <span>Transaction ID:</span>
              <code>${transactionId}</code>
            </div>
            <div class="detail-row">
              <span>Status:</span>
              <span class="status-indicator">Checking...</span>
            </div>
          </div>
          <div class="verification-progress">
            <div class="progress-bar">
              <div class="progress-fill" id="verificationProgress"></div>
            </div>
          </div>
          <p class="verification-note">
            <small>This usually takes 10-30 seconds. Please don't close this window.</small>
          </p>
        </div>
        
        <style>
          .payment-verification { text-align: center; }
          .verification-animation {
            position: relative; width: 80px; height: 80px;
            margin: 20px auto;
          }
          .pulse-ring {
            width: 80px; height: 80px; border: 2px solid #28a745;
            border-radius: 50%; position: absolute;
            animation: pulse-ring 2s infinite;
          }
          .pulse-dot {
            width: 20px; height: 20px; background: #28a745;
            border-radius: 50%; position: absolute;
            top: 50%; left: 50%; transform: translate(-50%, -50%);
          }
          @keyframes pulse-ring {
            0% { transform: scale(1); opacity: 1; }
            100% { transform: scale(1.5); opacity: 0; }
          }
          .verification-details {
            background: #f8f9fa; padding: 15px; border-radius: 8px;
            margin: 20px 0; text-align: left;
          }
          .detail-row {
            display: flex; justify-content: space-between;
            margin-bottom: 8px; align-items: center;
          }
          .detail-row code {
            background: #e9ecef; padding: 2px 6px; border-radius: 4px;
            font-size: 0.85rem;
          }
          .status-indicator {
            color: #ffc107; font-weight: 500;
          }
          .verification-progress {
            width: 100%; background: #e9ecef; height: 4px;
            border-radius: 2px; margin: 15px 0; overflow: hidden;
          }
          .progress-fill {
            height: 100%; background: #28a745; width: 0%;
            animation: progressFill 180s linear; /* 3 minutes */
          }
          @keyframes progressFill {
            0% { width: 0%; }
            100% { width: 100%; }
          }
          .verification-note {
            color: #6c757d; margin-top: 15px;
          }
        </style>
      `,
      allowOutsideClick: false,
      showConfirmButton: false,
      showCloseButton: false,
      width: '500px'
    });
  }

  function showPaymentMonitoringError(transactionId, error) {
  Swal.fire({
    title: 'Payment Verification Issue',
    html: `
      <div class="monitoring-error">
        <i class="fas fa-exclamation-triangle text-warning mb-3" style="font-size: 3rem;"></i>
        <p>We're having trouble verifying your payment status automatically.</p>
        
        <div class="error-details">
          <h6>What this means:</h6>
          <ul class="text-start">
            <li>Your payment might still be processing</li>
            <li>There might be a temporary network issue</li>
            <li>The payment system is experiencing delays</li>
          </ul>
        </div>
        
        <div class="next-steps">
          <h6>What you can do:</h6>
          <div class="step-buttons">
            <button class="btn-step" onclick="recheckPaymentStatus('${transactionId}')">
              <i class="fas fa-sync-alt me-2"></i>Try Again
            </button>
            <button class="btn-step" onclick="contactSupport('${transactionId}')">
              <i class="fas fa-phone me-2"></i>Contact Support
            </button>
          </div>
        </div>
        
        <div class="transaction-ref">
          <p><strong>Reference:</strong> ${transactionId}</p>
          <p><small>Save this reference number for support inquiries</small></p>
        </div>
      </div>
      
      <style>
        .monitoring-error { text-align: center; }
        .error-details, .next-steps {
          background: #f8f9fa; padding: 15px; border-radius: 8px;
          margin: 15px 0; text-align: left;
        }
        .error-details h6, .next-steps h6 { 
          color: #495057; margin-bottom: 10px; 
        }
        .step-buttons { 
          display: flex; gap: 10px; justify-content: center;
          flex-wrap: wrap; 
        }
        .btn-step {
          background: #007bff; color: white; border: none;
          padding: 8px 16px; border-radius: 6px; cursor: pointer;
          transition: background 0.3s;
        }
        .btn-step:hover { background: #0056b3; }
        .transaction-ref {
          background: #e8f5e8; padding: 15px; border-radius: 8px;
          border-left: 4px solid #28a745;
        }
      </style>
    `,
    confirmButtonText: 'Close',
    confirmButtonColor: '#6c757d',
    allowOutsideClick: false
  });
  }

  window.recheckPaymentStatus = function(transactionId) {
    Swal.close();
    startEnhancedPaymentStatusMonitoring(transactionId);
  };

  window.contactSupport = function(transactionId) {
    Swal.fire({
      title: 'Contact Support',
      html: `
        <div class="support-contact">
          <p>For assistance with transaction <code>${transactionId}</code>:</p>
          
          <div class="contact-methods">
            <div class="contact-item">
              <i class="fas fa-envelope text-primary"></i>
              <div>
                <strong>Email Support</strong>
                <p>support@licensepro.lk</p>
              </div>
            </div>
            
            <div class="contact-item">
              <i class="fas fa-phone text-success"></i>
              <div>
                <strong>Phone Support</strong>
                <p>+94 11 123 4567</p>
              </div>
            </div>
            
            <div class="contact-item">
              <i class="fas fa-comments text-info"></i>
              <div>
                <strong>Live Chat</strong>
                <p>Available 9 AM - 6 PM</p>
              </div>
            </div>
          </div>
          
          <div class="support-hours">
            <h6>Support Hours:</h6>
            <p>Monday - Friday: 9:00 AM - 6:00 PM<br>
              Saturday: 9:00 AM - 1:00 PM<br>
              Sunday: Closed</p>
          </div>
        </div>
        
        <style>
          .support-contact { text-align: center; }
          .contact-methods { 
            display: grid; gap: 15px; margin: 20px 0; 
          }
          .contact-item {
            display: flex; align-items: center; text-align: left;
            background: #f8f9fa; padding: 15px; border-radius: 8px;
          }
          .contact-item i { 
            font-size: 1.5rem; margin-right: 15px; 
          }
          .contact-item strong { display: block; margin-bottom: 5px; }
          .contact-item p { margin: 0; color: #6c757d; }
          .support-hours {
            background: #e8f5e8; padding: 15px; border-radius: 8px;
            border-left: 4px solid #28a745; text-align: left;
          }
          .support-hours h6 { color: #155724; margin-bottom: 10px; }
        </style>
      `,
      confirmButtonText: 'Close',
      confirmButtonColor: '#007bff'
    });
  };

  function monitorPaymentStatus(transactionId, options = {}) {
    const {
      checkInterval = 3000,
      maxChecks = 100,
      showModal = true
    } = options;
    
    let checkCount = 0;

    if (showModal) {
      Swal.fire({
        title: 'Monitoring Payment...',
        html: `
          <div class="payment-monitoring">
            <div class="monitoring-animation">
              <div class="pulse-dot"></div>
            </div>
            <p>We're monitoring your payment status...</p>
            <p><small>Please complete your payment on PayHere</small></p>
            <div class="monitoring-info">
              <div>Transaction ID: <strong>${transactionId}</strong></div>
            </div>
          </div>
          <style>
            .payment-monitoring { text-align: center; }
            .monitoring-animation { margin: 20px 0; }
            .pulse-dot {
              width: 40px; height: 40px; background: #28a745;
              border-radius: 50%; margin: 0 auto;
              animation: pulse 2s infinite;
            }
            @keyframes pulse {
              0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.7); }
              70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(40, 167, 69, 0); }
              100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(40, 167, 69, 0); }
            }
            .monitoring-info {
              background: #f8f9fa; padding: 15px; border-radius: 8px;
              margin-top: 20px; font-size: 0.9rem;
            }
          </style>
        `,
        allowOutsideClick: false,
        showConfirmButton: false,
        showCloseButton: true
      });
    }

    const statusInterval = setInterval(async () => {
      checkCount++;
      
      try {
        console.log(`Checking payment status for transaction: ${transactionId} (attempt ${checkCount})`);
        
        const response = await fetch(`${API_BASE_URL}/payment/status/${transactionId}`, {
          method: 'GET',
          headers: {
            Authorization: "Bearer " + (localStorage.getItem("smartreg_token") || sessionStorage.getItem("smartreg_token")),
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const statusData = await response.json();
          console.log("Payment status response:", statusData);
          
          if (statusData.status === 200 || statusData.code === 200) {
            const paymentStatus = statusData.data.status;
            console.log("Payment status:", paymentStatus);
            
            if (paymentStatus === 'COMPLETED') {
              clearInterval(statusInterval);
              Swal.close();
              showPaymentSuccessModal(statusData.data);
            } else if (paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED') {
              clearInterval(statusInterval);
              Swal.close();
              showPaymentFailedModal(statusData.data);
            }
          }
        } else {
          console.error("Error response:", response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }

      if (checkCount >= maxChecks) {
        clearInterval(statusInterval);
        showPaymentTimeoutModal(transactionId);
      }
    }, checkInterval);

    return statusInterval;
  }

  function handlePayHerePaymentWithPostMessage(paymentData) {
    Swal.close();
    
    window.addEventListener('message', function(event) {
      if (event.origin === 'https://sandbox.payhere.lk' || event.origin === 'https://www.payhere.lk') {
        console.log('PayHere message received:', event.data);
        
        if (event.data.type === 'payment_success') {
          Swal.close();
          monitorPaymentStatus(paymentData.transactionId);
        } else if (event.data.type === 'payment_failed') {
          Swal.close();
          showAlert('Payment Failed', 'Payment was not completed successfully.', 'error');
        }
      }
    });
    
    Swal.fire({
      title: 'Complete Your Payment',
      html: `
        <div class="payhere-embedded-container">
          <div class="payment-info-card">
            <h6><i class="fas fa-info-circle me-2"></i>Payment Details</h6>
            <div class="info-row">
              <span>Application:</span>
              <strong>#${paymentData.paymentId}</strong>
            </div>
            <div class="info-row">
              <span>Amount:</span>
              <strong>Rs. ${paymentData.amount.toLocaleString()}</strong>
            </div>
            <div class="info-row">
              <span>Transaction ID:</span>
              <strong>${paymentData.transactionId}</strong>
            </div>
          </div>
          
          <div class="payhere-embed-frame">
            <iframe 
              id="payhere-payment-iframe" 
              src="${paymentData.checkoutUrl}" 
              width="100%" 
              height="650px" 
              frameborder="0"
              style="border: none; border-radius: 8px;">
            </iframe>
          </div>
          
          <div class="payment-instructions">
            <div class="instruction-item">
              <i class="fas fa-credit-card text-primary me-2"></i>
              <span>Select your preferred payment method (Visa, MasterCard, etc.)</span>
            </div>
            <div class="instruction-item">
              <i class="fas fa-keyboard text-success me-2"></i>
              <span>Enter your card details securely</span>
            </div>
            <div class="instruction-item">
              <i class="fas fa-lock text-warning me-2"></i>
              <span>Complete the payment process</span>
            </div>
          </div>
        </div>
        
        <style>
          .payhere-embedded-container {
            text-align: left;
            max-width: 100%;
          }
          .payment-info-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 20px;
          }
          .payment-info-card h6 {
            color: white;
            margin-bottom: 15px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 5px 0;
          }
          .payhere-embed-frame {
            background: white;
            border-radius: 12px;
            padding: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            margin-bottom: 20px;
          }
          .payment-instructions {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            border-left: 4px solid #007bff;
          }
          .instruction-item {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
            font-size: 0.9rem;
          }
          
          @media (max-width: 768px) {
            .payhere-embed-frame iframe {
              height: 500px;
            }
          }
        </style>
      `,
      showConfirmButton: false,
      showCancelButton: true,
      cancelButtonText: '<i class="fas fa-times me-2"></i>Close',
      cancelButtonColor: '#6c757d',
      allowOutsideClick: false,
      width: '90%',
      //The Alert Is Open When done of the moniring Payment Status
      didOpen: () => {
        monitorPaymentStatus(paymentData.transactionId, {showModal: false});
      }
    });
  }

  function showPaymentSuccessModal(paymentStatusData) {
    Swal.fire({
      title: null,
      html: `
        <div class="payment-success-modal">
            <div class="success-animation-container">
                <div class="success-checkmark">
                    <div class="success-checkmark-circle"></div>
                    <div class="success-checkmark-stem"></div>
                    <div class="success-checkmark-kick"></div>
                </div>
            </div>
            
            <h3 class="success-title">🎉 Payment Successful!</h3>
            <p class="success-subtitle">Your exam fee has been processed successfully</p>
            
            <div class="payment-receipt-card">
                <div class="receipt-header">
                    <i class="fas fa-receipt me-2"></i>
                    <span>Payment Receipt</span>
                </div>
                <div class="receipt-body">
                    <div class="receipt-row">
                        <span class="label">Transaction ID:</span>
                        <span class="value">${paymentStatusData.transactionId}</span>
                    </div>
                    <div class="receipt-row">
                        <span class="label">Status:</span>
                        <span class="value">${paymentStatusData.statusMessage}</span>
                    </div>
                    <div class="receipt-row">
                        <span class="label">Payment Method:</span>
                        <span class="value">${paymentStatusData.paymentMethod}</span>
                    </div>
                    <div class="receipt-row">
                        <span class="label">Date & Time:</span>
                        <span class="value">${new Date(paymentStatusData.paymentDate).toLocaleString()}</span>
                    </div>
                    <div class="receipt-row total-row">
                        <span class="label">Amount Paid:</span>
                        <span class="value amount">Rs. ${paymentStatusData.amount.toLocaleString()}</span>
                    </div>
                </div>
            </div>
            
            <div class="next-steps-card">
                <h6><i class="fas fa-route me-2"></i>What Happens Next?</h6>
                <div class="next-steps-timeline">
                    <div class="timeline-step completed">
                        <i class="fas fa-check-circle"></i>
                        <span>Payment Confirmed</span>
                    </div>
                    <div class="timeline-step next">
                        <i class="fas fa-envelope"></i>
                        <span>Exam confirmation via SMS/Email</span>
                    </div>
                    <div class="timeline-step future">
                        <i class="fas fa-graduation-cap"></i>
                        <span>Attend written examination</span>
                    </div>
                    <div class="timeline-step future">
                        <i class="fas fa-car"></i>
                        <span>Practical driving test (if passed)</span>
                    </div>
                </div>
            </div>
            
            <div class="important-reminders">
                <h6><i class="fas fa-exclamation-circle me-2"></i>Important Reminders</h6>
                <ul>
                    <li>Save this receipt for your records</li>
                    <li>Check your email/SMS for exam details</li>
                    <li>Bring your NIC and this receipt to the exam</li>
                    <li>Arrive 30 minutes before your exam time</li>
                </ul>
            </div>
        </div>
        
        <style>
            .payment-success-modal { text-align: center; }
            .success-animation-container { margin: 20px 0; }
            .success-checkmark {
                width: 80px; height: 80px; border-radius: 50%;
                display: block; stroke-width: 2; stroke: #28a745;
                stroke-miterlimit: 10; margin: 0 auto;
                box-shadow: inset 0px 0px 0px #28a745;
                animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both;
                position: relative;
            }
            .success-checkmark-circle {
                stroke-dasharray: 166; stroke-dashoffset: 166;
                stroke-width: 2; stroke-miterlimit: 10;
                stroke: #28a745; fill: none;
                animation: stroke .6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
                width: 80px; height: 80px; border-radius: 50%;
                background: #f0f8f0; border: 2px solid #28a745;
            }
            .success-checkmark-stem, .success-checkmark-kick {
                position: absolute; background: #28a745;
            }
            .success-checkmark-stem {
                left: 35px; top: 42px; width: 3px; height: 15px;
                transform-origin: bottom; animation: checkmark-stem 0.3s ease-in-out 0.6s forwards;
                transform: rotate(-45deg) scaleY(0);
            }
            .success-checkmark-kick {
                left: 30px; top: 48px; width: 12px; height: 3px;
                transform-origin: left; animation: checkmark-kick 0.3s ease-in-out 0.8s forwards;
                transform: rotate(45deg) scaleX(0);
            }
            @keyframes stroke {
                100% { stroke-dashoffset: 0; }
            }
            @keyframes scale {
                0%, 100% { transform: none; }
                50% { transform: scale3d(1.1, 1.1, 1); }
            }
            @keyframes fill {
                100% { box-shadow: inset 0px 0px 0px 30px #28a745; }
            }
            @keyframes checkmark-stem {
                100% { transform: rotate(-45deg) scaleY(1); }
            }
            @keyframes checkmark-kick {
                100% { transform: rotate(45deg) scaleX(1); }
            }
            .success-title {
                color: #28a745; margin: 20px 0 10px 0; font-weight: 700;
            }
            .success-subtitle {
                color: #6c757d; margin-bottom: 25px;
            }
            .payment-receipt-card {
                background: #f8f9fa; border: 2px dashed #28a745;
                border-radius: 15px; margin-bottom: 25px; overflow: hidden;
            }
            .receipt-header {
                background: #28a745; color: white; padding: 15px;
                font-weight: 600; font-size: 1.1rem;
            }
            .receipt-body { padding: 20px; }
            .receipt-row {
                display: flex; justify-content: space-between;
                margin-bottom: 12px; padding: 8px 0;
            }
            .receipt-row.total-row {
                border-top: 2px solid #28a745; margin-top: 15px;
                padding-top: 15px; font-weight: 600;
            }
            .receipt-row .label { color: #6c757d; }
            .receipt-row .value { font-weight: 500; }
            .receipt-row .amount { color: #28a745; font-size: 1.2rem; }
            .next-steps-card, .important-reminders {
                background: #e8f5e8; padding: 20px; border-radius: 12px;
                margin-bottom: 20px; text-align: left;
            }
            .next-steps-card h6, .important-reminders h6 {
                color: #155724; margin-bottom: 15px;
            }
            .next-steps-timeline { }
            .timeline-step {
                display: flex; align-items: center; margin-bottom: 10px;
                padding: 8px; border-radius: 6px;
            }
            .timeline-step.completed {
                background: #d4edda; color: #155724;
            }
            .timeline-step.next {
                background: #fff3cd; color: #856404;
            }
            .timeline-step.future {
                background: #f8f9fa; color: #6c757d;
            }
            .timeline-step i { margin-right: 12px; width: 20px; }
            .important-reminders ul {
                margin: 0; padding-left: 20px;
            }
            .important-reminders li {
                margin-bottom: 8px; color: #155724;
            }
        </style>
      `,
      showCancelButton: true,
      confirmButtonText: '<i class="fas fa-download me-2"></i>Download Receipt',
      cancelButtonText: '<i class="fas fa-check me-2"></i>Continue',
      confirmButtonColor: "#28a745",
      cancelButtonColor: "#007bff",
      width: "700px",
    }).then((result) => {
      if (result.isConfirmed) {
        downloadPaymentReceiptFromBackend(paymentStatusData.transactionId);
      }

      sessionStorage.removeItem('currentPayment');
      
      loadDriverApplications().then(() => {
        loadSmartNotifications();
      });
    });
  }

  function showPaymentFailedModal(paymentStatusData) {
    Swal.fire({
      title: 'Payment Failed',
      html: `
        <div class="payment-failed-modal">
            <div class="failed-animation">
                <i class="fas fa-times-circle" style="font-size: 4rem; color: #dc3545; margin-bottom: 20px;"></i>
            </div>
            
            <h4 style="color: #dc3545; margin-bottom: 15px;">Payment Unsuccessful</h4>
            <p style="color: #6c757d; margin-bottom: 25px;">We're sorry, but your payment could not be processed.</p>
            
            <div class="failed-details-card">
                <div class="failed-header">
                    <i class="fas fa-info-circle me-2"></i>
                    <span>Transaction Details</span>
                </div>
                <div class="failed-body">
                    <div class="detail-row">
                        <span>Transaction ID:</span>
                        <strong>${paymentStatusData.transactionId}</strong>
                    </div>
                    <div class="detail-row">
                        <span>Status:</span>
                        <strong>${paymentStatusData.statusMessage}</strong>
                    </div>
                    <div class="detail-row">
                        <span>Amount:</span>
                        <strong>Rs. ${paymentStatusData.amount.toLocaleString()}</strong>
                    </div>
                </div>
            </div>
            
            <div class="retry-suggestions">
                <h6><i class="fas fa-lightbulb me-2"></i>What You Can Do</h6>
                <ul>
                    <li>Check your card details and try again</li>
                    <li>Ensure sufficient balance in your account</li>
                    <li>Try a different payment method</li>
                    <li>Contact your bank if the issue persists</li>
                    <li>Contact our support team for assistance</li>
                </ul>
            </div>
        </div>
        
        <style>
            .payment-failed-modal { text-align: center; }
            .failed-details-card {
                background: #f8f9fa; border: 2px solid #dc3545;
                border-radius: 12px; margin-bottom: 20px; overflow: hidden;
            }
            .failed-header {
                background: #dc3545; color: white; padding: 12px;
                font-weight: 600;
            }
            .failed-body { padding: 15px; }
            .detail-row {
                display: flex; justify-content: space-between;
                margin-bottom: 8px; padding: 5px 0;
            }
            .retry-suggestions {
                background: #fff3cd; padding: 20px; border-radius: 10px;
                text-align: left; border: 1px solid #ffeaa7;
            }
            .retry-suggestions h6 { color: #856404; margin-bottom: 15px; }
            .retry-suggestions ul { margin: 0; padding-left: 20px; }
            .retry-suggestions li { margin-bottom: 8px; color: #856404; }
        </style>
      `,
      showCancelButton: true,
      confirmButtonText: '<i class="fas fa-redo me-2"></i>Try Again',
      cancelButtonText: '<i class="fas fa-times me-2"></i>Close',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        showPaymentForm();
      }
    });
  }

  function showPaymentTimeoutModal(transactionId) {
    Swal.fire({
      title: 'Payment Status Unknown',
      html: `
        <div class="payment-timeout-modal">
            <div class="timeout-icon">
                <i class="fas fa-clock" style="font-size: 3rem; color: #ffc107; margin-bottom: 20px;"></i>
            </div>
            
            <p>We couldn't confirm your payment status automatically. This might mean:</p>
            
            <div class="timeout-reasons">
                <div class="reason-item">
                    <i class="fas fa-hourglass-half me-2"></i>
                    <span>Your payment is still being processed</span>
                </div>
                <div class="reason-item">
                    <i class="fas fa-wifi me-2"></i>
                    <span>Network connectivity issues</span>
                </div>
                <div class="reason-item">
                    <i class="fas fa-window-close me-2"></i>
                    <span>PayHere window was closed</span>
                </div>
            </div>
            
            <div class="timeout-actions">
                <p><strong>Transaction ID:</strong> ${transactionId}</p>
                <p><small>You can check your payment status manually or contact support if needed.</small></p>
            </div>
        </div>
        
        <style>
            .payment-timeout-modal { text-align: center; }
            .timeout-reasons {
                background: #fff3cd; padding: 20px; border-radius: 10px;
                margin: 20px 0; text-align: left;
            }
            .reason-item {
                display: flex; align-items: center;
                margin-bottom: 12px; color: #856404;
            }
            .timeout-actions {
                background: #f8f9fa; padding: 15px; border-radius: 8px;
                margin-top: 20px;
            }
        </style>
      `,
      showCancelButton: true,
      confirmButtonText: '<i class="fas fa-search me-2"></i>Check Status',
      cancelButtonText: '<i class="fas fa-times me-2"></i>Close',
      confirmButtonColor: '#ffc107',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        checkPaymentStatusManually(transactionId);
      }
    });
  }

  async function checkPaymentStatusManually(transactionId) {
    try {
      showLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/payment/status/${transactionId}`, {
        method: 'GET',
        headers: {
        Authorization: "Bearer " + (localStorage.getItem("smartreg_token") || sessionStorage.getItem("smartreg_token")),
          'Content-Type': 'application/json'
        }
      });

      showLoading(false);

      if (response.ok) {
        const statusData = await response.json();
        
        if (statusData.status === 200) {
          const paymentStatus = statusData.data.status;
          
          if (paymentStatus === 'COMPLETED') {
            showPaymentSuccessModal(statusData.data);
          } else if (paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED') {
            showPaymentFailedModal(statusData.data);
          } else {
            showAlert('Payment Status', `Your payment is currently: ${statusData.data.statusMessage}`, 'info');
          }
        } else {
          showAlert('Error', statusData.message || 'Could not retrieve payment status', 'error');
        }
      } else {
        showAlert('Error', 'Failed to check payment status. Please try again later.', 'error');
      }
    } catch (error) {
      showLoading(false);
      console.error('Error checking payment status:', error);
      showAlert('Error', 'Network error. Please check your connection and try again.', 'error');
    }
  }

  async function downloadPaymentReceiptFromBackend(transactionId) {
    try {
      showLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/payment/receipt/${transactionId}`, {
        method: 'GET',
        headers: {
        Authorization: "Bearer " + (localStorage.getItem("smartreg_token") || sessionStorage.getItem("smartreg_token"))
        }
      });

      showLoading(false);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `LicensePro_Receipt_${transactionId}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showAlert('Success', 'Receipt downloaded successfully!', 'success');
      } else {
        showAlert('Error', 'Failed to download receipt. Please try again.', 'error');
      }
    } catch (error) {
      showLoading(false);
      console.error('Error downloading receipt:', error);
      showAlert('Error', 'Network error. Please check your connection and try again.', 'error');
    }
  }

// Get payment history for driver
// async function getDriverPaymentHistory() {
//   try {
//     showLoading(true);
    
//     const response = await fetch(`${API_BASE_URL}/payment/history/${currentDriverId}`, {
//       method: 'GET',
//       headers: {
//         Authorization: "Bearer " + (localStorage.getItem("smartreg_token") || sessionStorage.getItem("smartreg_token")),
//         'Content-Type': 'application/json'
//       }
//     });

//     showLoading(false);

//     if (response.ok) {
//       const historyData = await response.json();
      
//       if (historyData.status === 200) {
//         displayPaymentHistory(historyData.data);
//       } else {
//         showAlert('Error', historyData.message || 'Could not retrieve payment history', 'error');
//       }
//     } else {
//       showAlert('Error', 'Failed to load payment history. Please try again later.', 'error');
//     }
//   } catch (error) {
//     showLoading(false);
//     console.error('Error fetching payment history:', error);
//     showAlert('Error', 'Network error. Please check your connection and try again.', 'error');
//   }
// }

// function displayPaymentHistory(paymentHistory) {
//   if (!paymentHistory || paymentHistory.length === 0) {
//     showAlert('No History', 'You have no payment history yet.', 'info');
//     return;
//   }

//   const historyHtml = paymentHistory.map(payment => `
//     <div class="payment-history-item ${payment.status.toLowerCase()}">
//         <div class="history-header">
//             <div class="transaction-info">
//                 <strong>Transaction: ${payment.transactionId}</strong>
//                 <span class="status-badge ${payment.status.toLowerCase()}">${payment.statusMessage}</span>
//             </div>
//             <div class="amount-info">
//                 <strong>Rs. ${payment.amount.toLocaleString()}</strong>
//             </div>
//         </div>
//         <div class="history-details">
//             <div class="detail-item">
//                 <i class="fas fa-calendar me-1"></i>
//                 ${payment.paymentDate ? new Date(payment.paymentDate).toLocaleString() : 'N/A'}
//             </div>
//             <div class="detail-item">
//                 <i class="fas fa-credit-card me-1"></i>
//                 ${payment.paymentMethod}
//             </div>
//             ${payment.status === 'COMPLETED' ? `
//                 <div class="detail-item">
//                     <a href="${payment.receiptUrl}" class="receipt-link">
//                         <i class="fas fa-download me-1"></i>Download Receipt
//                     </a>
//                 </div>
//             ` : ''}
//         </div>
//     </div>
//   `).join('');

//   Swal.fire({
//     title: '<i class="fas fa-history me-2"></i>Payment History',
//     html: `
//       <div class="payment-history-container">
//           ${historyHtml}
//       </div>
      
//       <style>
//           .payment-history-container {
//               max-height: 500px; overflow-y: auto; text-align: left;
//           }
//           .payment-history-item {
//               border: 1px solid #e9ecef; border-radius: 10px;
//               margin-bottom: 15px; padding: 20px; background: #f8f9fa;
//           }
//           .payment-history-item.completed {
//               border-color: #28a745; background: #f0f8f0;
//           }
//           .payment-history-item.failed {
//               border-color: #dc3545; background: #fdf2f2;
//           }
//           .payment-history-item.pending {
//               border-color: #ffc107; background: #fffbf0;
//           }
//           .history-header {
//               display: flex; justify-content: space-between;
//               align-items: center; margin-bottom: 15px;
//           }
//           .status-badge {
//               padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;
//               font-weight: 500; margin-left: 10px;
//           }
//           .status-badge.completed {
//               background: #d4edda; color: #155724;
//           }
//           .status-badge.failed {
//               background: #f8d7da; color: #721c24;
//           }
//           .status-badge.pending {
//               background: #fff3cd; color: #856404;
//           }
//           .history-details {
//               display: flex; flex-wrap: wrap; gap: 15px;
//           }
//           .detail-item {
//               color: #6c757d; font-size: 0.9rem;
//           }
//           .receipt-link {
//               color: #007bff; text-decoration: none;
//           }
//           .receipt-link:hover {
//               text-decoration: underline;
//           }
//       </style>
//     `,
//     width: '800px',
//     confirmButtonText: '<i class="fas fa-times me-2"></i>Close',
//     confirmButtonColor: '#6c757d'
//   });
// }

// Helper function to format payment method display name
// function getPaymentMethodName(method) {
//   const methods = {
//     'CARD': 'Credit/Debit Card',
//     'BANK': 'Bank Transfer', 
//     'MOBILE': 'Mobile Payment',
//     'card': 'Credit/Debit Card',
//     'bank': 'Bank Transfer',
//     'mobile': 'Mobile Payment'
//   };
//   return methods[method] || method.toUpperCase();
// }


  // =================== FORM HANDLING ===================

  window.showLicenseForm = function () {
    $("#licenseModal").show();
    selectedVehicleClasses = [];
    updateSelectedVehicleClassesDisplay();
    $("#vehicleClass").prop("disabled", true);
  };

  window.closeLicenseModal = function () {
    $("#licenseModal").hide();
    resetForm();
  };

  function resetForm() {
    $("#licenseForm")[0].reset();
    selectedVehicleClasses = [];
    updateSelectedVehicleClassesDisplay();
    clearValidationMessages();
    hidePhotoPreview();
    hideMedicalPreview();
    $("#vehicleClass").prop("disabled", true);
  }

  $("#licenseType").on("change", function () {
    const licenseType = $(this).val();
    const vehicleClassSelect = $("#vehicleClass");

    vehicleClassSelect.empty();
    selectedVehicleClasses = [];
    updateSelectedVehicleClassesDisplay();

    if (licenseType && vehicleClassesByLicense[licenseType]) {
      vehicleClassesByLicense[licenseType].forEach((vehicleClass) => {
        vehicleClassSelect.append(
          $("<option></option>").val(vehicleClass.value).text(vehicleClass.text)
        );
      });
      vehicleClassSelect.prop("disabled", false);
    } else {
      vehicleClassSelect.prop("disabled", true);
    }
  });

  $("#vehicleClass").on("change", function () {
    const selectedOptions = $(this).find("option:selected");

    selectedOptions.each(function () {
      const value = $(this).val();
      const text = $(this).text();

      if (!selectedVehicleClasses.some((item) => item.value === value)) {
        selectedVehicleClasses.push({ value, text });
      }
    });

    $(this).val([]);
    updateSelectedVehicleClassesDisplay();
  });

  function updateSelectedVehicleClassesDisplay() {
    const container = $("#selectedVehicleClasses");

    if (selectedVehicleClasses.length === 0) {
      container.html(
        '<span style="color: #6c757d; font-size: 0.9rem;">No vehicle classes selected</span>'
      );
    } else {
      container.html(
        selectedVehicleClasses
          .map(
            (item) => `
                    <div class="selected-item">
                        ${item.text}
                        <span class="remove-item" onclick="removeVehicleClass('${item.value}')">×</span>
                    </div>
                `
          )
          .join("")
      );
    }
  }


  function calculateExamFee(licenseType, vehicleClasses) {
    let baseFee = 3000;

    switch (licenseType?.toLowerCase()) {
      case "learner":
        baseFee = 2500;
        break;
      case "restricted":
        baseFee = 3000;
        break;
      case "full":
        baseFee = 4000;
        break;
      case "heavy":
        baseFee = 6000;
        break;
      case "commercial":
        baseFee = 7500;
        break;
      case "international":
        baseFee = 5000;
        break;
      case "motorcycle":
        baseFee = 3500;
        break;
      case "special":
        baseFee = 8000;
        break;
      default:
        baseFee = 3000;
    }

    // Handle vehicle classes - can be array or comma-separated string
    const classCount = Array.isArray(vehicleClasses)
      ? vehicleClasses.length
      : vehicleClasses
      ? vehicleClasses.split(",").length
      : 1;
      
    const additionalFee = Math.max(0, classCount - 1) * 500;

    return baseFee + additionalFee;
  }

  async function calculateExamFeeFromBackend(licenseType, vehicleClasses) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/payment/calculate-fee?licenseType=${licenseType}&vehicleClasses=${vehicleClasses || ''}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const feeData = await response.json();
        if (feeData.status === 200) {
          return feeData.data.examFee;
        }
      }
      
      return calculateExamFee(licenseType, vehicleClasses);
    } catch (error) {
      console.error('Error fetching exam fee from backend:', error);
      return calculateExamFee(licenseType, vehicleClasses);
    }
  }

  window.removeVehicleClass = function (value) {
    selectedVehicleClasses = selectedVehicleClasses.filter(
      (item) => item.value !== value
    );
    updateSelectedVehicleClassesDisplay();
  };

  // =================== FILE VALIDATION ===================

  async function validatePhoto(file) {
    const validationDiv = $("#photoValidation");
    const maxSize = 2 * 1024 * 1024;
    const minDimension = 300;
    const maxDimension = 2000;

    validationDiv.empty();

    if (!file) return false;

    if (!file.type.match(/image\/(jpeg|jpg|png)$/i)) {
      showValidationMessage(
        "photoValidation",
        "Please upload a JPEG or PNG image file.",
        "error"
      );
      return false;
    }

    if (file.size > maxSize) {
      showValidationMessage(
        "photoValidation",
        "Photo size must be less than 2MB.",
        "error"
      );
      return false;
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = function () {
        const width = this.naturalWidth;
        const height = this.naturalHeight;

        let errors = [];

        if (width < minDimension || height < minDimension) {
          errors.push(`Minimum dimensions: ${minDimension}x${minDimension}px`);
        }

        if (width > maxDimension || height > maxDimension) {
          errors.push(`Maximum dimensions: ${maxDimension}x${maxDimension}px`);
        }

        if (errors.length > 0) {
          showValidationMessage("photoValidation", errors.join(". "), "error");
          resolve(false);
        } else {
          showValidationMessage(
            "photoValidation",
            "Photo validation successful!",
            "success"
          );
          resolve(true);
        }
      };

      img.onerror = function () {
        showValidationMessage(
          "photoValidation",
          "Unable to load image. Please try another file.",
          "error"
        );
        resolve(false);
      };

      // To See the img Preview , Thw Browser Genarate a link for that , imediately cansee a preview
      img.src = URL.createObjectURL(file);
    });
  }

  function validateMedicalFile(file) {
    if (!file) return false;

    if (file.type !== "application/pdf") {
      showAlert(
        "Invalid File",
        "Medical certificate must be a PDF file.",
        "error"
      );
      return false;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      showAlert(
        "File Too Large",
        "Medical certificate must be less than 5MB.",
        "error"
      );
      return false;
    }

    return true;
  }

  function showValidationMessage(containerId, message, type) {
    const container = $("#" + containerId);
    const className =
      type === "error" ? "validation-error" : "validation-success";
    const icon =
      type === "error" ? "fas fa-exclamation-triangle" : "fas fa-check-circle";

    container.html(`
            <div class="validation-message ${className}">
                <i class="${icon} me-2"></i>${message}
            </div>
        `);
  }

  function clearValidationMessages() {
    $("#photoValidation").empty();
  }

  $("#photoUpload").on("change", async function (e) {
    const file = e.target.files[0];
    if (file) {
      const preview = $("#photoPreview");
      preview.show().attr("src", URL.createObjectURL(file));
      await validatePhoto(file);
    } else {
      hidePhotoPreview();
    }
  });

  $("#medicalUpload").on("change", function (e) {
    const file = e.target.files[0];
    if (file) {
      if (validateMedicalFile(file)) {
        $("#medicalPreview").show();
        $("#pdfName").text(file.name);
      } else {
        $(this).val("");
        hideMedicalPreview();
      }
    } else {
      hideMedicalPreview();
    }
  });

  function hidePhotoPreview() {
    $("#photoPreview").hide().attr("src", "#");
  }

  function hideMedicalPreview() {
    $("#medicalPreview").hide();
    $("#pdfName").text("");
  }

  // =================== FORM SUBMISSION ===================

  $("#licenseForm").on("submit", async function (e) {
    e.preventDefault();
    showLoading(true);

    try {

      if (selectedVehicleClasses.length === 0) {
        throw new Error("Please select at least one vehicle class.");
      }

      const photoFile = $("#photoUpload")[0].files[0];
      if (!photoFile) {
        throw new Error("Please upload a passport photo.");
      }

      const isPhotoValid = await validatePhoto(photoFile);
      if (!isPhotoValid) {
        throw new Error("Please upload a valid passport photo.");
      }

      const medicalFile = $("#medicalUpload")[0].files[0];
      if (!medicalFile || !validateMedicalFile(medicalFile)) {
        throw new Error("Please upload a valid medical certificate.");
      }

      const applicationData = {
        licenseType: $("#licenseType").val(),
        examLanguage: $("#examLanguage").val(),
        nicNumber: $("#nicNumber").val(),
        bloodGroup: $("#bloodGroup").val(),
        dateOfBirth: $("#dateOfBirth").val(),
        phoneNumber: $("#phoneNumber").val(),
        address: $("#address").val(),
      };

      const response = await submitLicenseApplication(
        applicationData,
        photoFile,
        medicalFile
      );

      showLoading(false);

      Swal.fire({
        title: "🎉 Application Submitted Successfully!",
        html: `
                    <div class="application-success">
                        <div class="success-icon-large">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="application-details-card">
                            <h6>Application Details</h6>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <label>Application ID:</label>
                                    <strong>#${response.id}</strong>
                                </div>
                                <div class="detail-item">
                                    <label>License Type:</label>
                                    <strong>${applicationData.licenseType.toUpperCase()}</strong>
                                </div>
                                <div class="detail-item">
                                    <label>Status:</label>
                                    <span class="badge bg-warning">PENDING REVIEW</span>
                                </div>
                                <div class="detail-item">
                                    <label>Submitted:</label>
                                    <strong>${new Date().toLocaleString()}</strong>
                                </div>
                            </div>
                        </div>
                        <div class="timeline-card">
                            <h6><i class="fas fa-route me-2"></i>Application Journey</h6>
                            <div class="journey-timeline">
                                <div class="journey-step completed">
                                    <i class="fas fa-check-circle"></i>
                                    <span>Application Submitted</span>
                                </div>
                                <div class="journey-step current">
                                    <i class="fas fa-clock"></i>
                                    <span>Document Review (3-5 days)</span>
                                </div>
                                <div class="journey-step upcoming">
                                    <i class="fas fa-calendar-check"></i>
                                    <span>Exam Scheduling</span>
                                </div>
                                <div class="journey-step upcoming">
                                    <i class="fas fa-graduation-cap"></i>
                                    <span>Written Examination</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <style>
                        .application-success { text-align: center; }
                        .success-icon-large {
                            font-size: 4rem; color: #28a745; margin-bottom: 20px;
                            animation: successPulse 2s infinite;
                        }
                        @keyframes successPulse {
                            0%, 100% { transform: scale(1); }
                            50% { transform: scale(1.1); }
                        }
                        .application-details-card, .timeline-card {
                            background: #f8f9fa; padding: 20px; border-radius: 12px;
                            margin-bottom: 20px; text-align: left;
                        }
                        .application-details-card h6, .timeline-card h6 {
                            color: #495057; margin-bottom: 15px; text-align: center;
                        }
                        .detail-grid {
                            display: grid; grid-template-columns: 1fr 1fr; gap: 15px;
                        }
                        .detail-item {
                            display: flex; flex-direction: column;
                        }
                        .detail-item label {
                            font-size: 0.85rem; color: #6c757d; margin-bottom: 2px;
                        }
                        .journey-timeline { }
                        .journey-step {
                            display: flex; align-items: center; padding: 12px;
                            margin-bottom: 8px; border-radius: 8px;
                        }
                        .journey-step.completed {
                            background: #d4edda; color: #155724;
                        }
                        .journey-step.current {
                            background: #fff3cd; color: #856404;
                        }
                        .journey-step.upcoming {
                            background: #e9ecef; color: #6c757d;
                        }
                        .journey-step i { margin-right: 15px; width: 20px; }
                    </style>
                `,
        confirmButtonText:
          '<i class="fas fa-tachometer-alt me-2"></i>View Dashboard',
        confirmButtonColor: "#28a745",
        width: "600px",
      });

      closeLicenseModal();
      loadDriverApplications().then(() => {
        loadSmartNotifications();
      });
    } catch (error) {
      showLoading(false);

      let errorMessage = "Failed to submit application";
      if (typeof error === "string") {
        errorMessage = error;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.responseJSON && error.responseJSON.message) {
        errorMessage = error.responseJSON.message;
      }

      Swal.fire({
        title: "❌ Application Submission Failed",
        text: errorMessage,
        icon: "error",
        confirmButtonColor: "#dc3545",
      });
    }
  });

  // =================== INPUT FORMATTERS ===================

  $("#phoneNumber").on("input", function (e) {
    let value = $(this).val().replace(/\D/g, "");

    if (value.startsWith("94")) {
      value = value.substring(2);
    }
    if (value.startsWith("0")) {
      value = value.substring(1);
    }

    if (value.length > 0) {
      if (value.length <= 9) {
        value = "+94 " + value.replace(/(\d{2})(\d{3})(\d{4})/, "$1 $2 $3");
      } else {
        value =
          "+94 " +
          value.substring(0, 9).replace(/(\d{2})(\d{3})(\d{4})/, "$1 $2 $3");
      }
    }

    $(this).val(value);
  });

  $("#nicNumber").on("input", function (e) {
    let value = $(this)
      .val()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");

    if (value.length > 12) {
      value = value.substring(0, 12);
    }

    $(this).val(value);
  });

  $("#dateOfBirth").on("change", function (e) {
    const birthDate = new Date($(this).val());
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    if (age < 18) {
      Swal.fire({
        title: "Age Requirement Not Met",
        text: "You must be at least 18 years old to apply for a driving license.",
        icon: "error",
      });
      $(this).val("");
    }
  });

  // =================== APPLICATION DETAILS MODAL ===================

  window.viewApplicationDetails = function (applicationId) {
    showLoading(true);
    console.log("id app: " + applicationId);

    const application = currentApplications.find(
      (app) => app.id == applicationId
    );
    if (!application) {
      showLoading(false);
      showAlert("Error", "Application not found.", "error");
      return;
    }

    Promise.all([
      application.status === "REJECTED"
        ? getDeclineReason(applicationId)
        : Promise.resolve(null),
      application.status === "APPROVED"
        ? getWrittenExamDetails(applicationId)
        : Promise.resolve(null),
      application.status !== "REJECTED" &&
      application.status !== "APPROVED" &&
      application.status !== "PENDING"
        ? Promise.resolve(`
          <div class="license-success-box">
            <i class="fas fa-check-circle"></i>
            <h2>Congratulations!</h2>
            <p>Your license process is <strong>fully completed</strong>.</p>
            <p>You can collect your driving license within 
              <b>6 months</b> or <b>1 year</b> depending on the issuing process.</p>
          </div>
      `)
      : Promise.resolve(null),
    ])
      .then(([declineReason, examDetails]) => {
        showLoading(false);
        showDetailedApplicationModal(application, {
          declineReason,
          examDetails,
        });
      })
      .catch((error) => {
        showLoading(false);
        showDetailedApplicationModal(application, {});
      });
  };

  function showDetailedApplicationModal(application, additionalInfo = {}) {
    
    const statusBadgeClass = getStatusBadgeClass(application.status);
    const vehicleClasses = Array.isArray(application.vehicleClasses)
      ? application.vehicleClasses.join(", ")
      : application.vehicleClasses || "N/A";
    const examFee = calculateExamFee(
      application.licenseType,
      application.vehicleClasses
    );
    console.log("Additinal Info: " + JSON.stringify(additionalInfo));

    let statusSpecificContent = getStatusSpecificContent(
      application,
      additionalInfo
    );

    Swal.fire({
      title: `📋 Application Details - #${application.id}`,
      html: `
                <div class="detailed-application-modal">
                    <div class="application-header-section">
                        <div class="status-indicator bg-${statusBadgeClass}">
                            ${application.status}
                        </div>
                        <div class="application-type-display">
                            <h5>${application.licenseType.toUpperCase()} LICENSE</h5>
                            <p>Vehicle Classes: ${vehicleClasses}</p>
                        </div>
                    </div>
                    
                    <div class="application-info-sections">
                        <div class="info-section personal-section">
                            <h6><i class="fas fa-user me-2"></i>Personal Information</h6>
                            <div class="info-grid">
                                <div class="info-field">
                                    <label>NIC Number:</label>
                                    <span>${application.nicNumber}</span>
                                </div>
                                <div class="info-field">
                                    <label>Blood Group:</label>
                                    <span>${application.bloodGroup}</span>
                                </div>
                                <div class="info-field">
                                    <label>Date of Birth:</label>
                                    <span>${formatDate(
                                      application.dateOfBirth
                                    )}</span>
                                </div>
                                <div class="info-field">
                                    <label>Phone:</label>
                                    <span>${application.phoneNumber}</span>
                                </div>
                                <div class="info-field full-width">
                                    <label>Address:</label>
                                    <span>${application.address}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="info-section application-section">
                            <h6><i class="fas fa-file-alt me-2"></i>Application Details</h6>
                            <div class="info-grid">
                                <div class="info-field">
                                    <label>Exam Language:</label>
                                    <span>${application.examLanguage}</span>
                                </div>
                                <div class="info-field">
                                    <label>Exam Fee:</label>
                                    <span class="fee-highlight">Rs. ${examFee.toLocaleString()}</span>
                                </div>
                                <div class="info-field">
                                    <label>Submitted:</label>
                                    <span>${formatDateTime(
                                      application.submittedDate
                                    )}</span>
                                </div>
                                ${
                                  application.lastModifiedDate
                                    ? `
                                    <div class="info-field">
                                        <label>Last Updated:</label>
                                        <span>${formatDateTime(
                                          application.lastModifiedDate
                                        )}</span>
                                    </div>
                                `
                                    : ""
                                }
                            </div>
                        </div>
                    </div>
                    
                    ${statusSpecificContent}
                </div>
                
                <style>
                    .detailed-application-modal { text-align: left; }
                    .application-header-section {
                        display: flex; justify-content: space-between; align-items: center;
                        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                        padding: 25px; border-radius: 15px; margin-bottom: 25px;
                    }
                    .status-indicator {
                        padding: 10px 20px; border-radius: 25px; color: white;
                        font-weight: 600; font-size: 1rem; text-transform: uppercase;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    }
                    .application-type-display h5 {
                        margin-bottom: 5px; color: #495057; font-weight: 700;
                    }
                    .application-type-display p {
                        margin: 0; color: #6c757d; font-size: 0.95rem;
                    }
                    .application-info-sections {
                        display: grid; grid-template-columns: 1fr 1fr; gap: 25px;
                        margin-bottom: 25px;
                    }
                    .info-section {
                        background: #ffffff; border: 2px solid #e9ecef;
                        border-radius: 15px; padding: 25px;
                        border-left: 5px solid #007bff;
                    }
                    .info-section h6 {
                        color: #495057; margin-bottom: 20px; font-weight: 600;
                        font-size: 1.1rem;
                    }
                    .info-grid {
                        display: grid; grid-template-columns: 1fr 1fr; gap: 15px;
                    }
                    .info-field {
                        display: flex; flex-direction: column;
                    }
                    .info-field.full-width { grid-column: 1 / -1; }
                    .info-field label {
                        font-size: 0.85rem; color: #6c757d; font-weight: 600;
                        margin-bottom: 4px; text-transform: uppercase;
                    }
                    .info-field span {
                        font-weight: 500; color: #495057; font-size: 0.95rem;
                    }
                    .fee-highlight {
                        color: #28a745 !important; font-weight: 700 !important;
                        font-size: 1.1rem !important;
                    }
                    .status-specific-section {
                        background: #ffffff; border-radius: 15px; padding: 25px;
                        margin-top: 20px; border: 2px solid #e9ecef;
                    }
                    @media (max-width: 768px) {
                        .application-info-sections { grid-template-columns: 1fr; }
                        .info-grid { grid-template-columns: 1fr; }
                        .application-header-section {
                            flex-direction: column; text-align: center;
                        }
                        .status-indicator { margin-bottom: 15px; }
                    }
                </style>
            `,
      width: "1000px",
      confirmButtonText: '<i class="fas fa-times me-2"></i>Close',
      confirmButtonColor: "#6c757d",
    });
  }

  // Function to check if exam date is expired
  function isExamDateExpired(examDate) {
      if (!examDate) return false;
      const today = new Date();
      const exam = new Date(examDate);
      return exam < today;
  }

  // Function to get exam change request button HTML
  async function getExamChangeButtonHTML(application) {

    if (!application.examDate || !isExamDateExpired(application.examDate)) {
          return '';
      }
      
      try {
          const hasPending = await ExamChangeRequestAPI.hasPendingRequest(application.id);
          
          if (hasPending) {
              return `
                  <div class="exam-change-section">
                      <div class="alert alert-info">
                          <i class="fas fa-info-circle me-2"></i>
                          You have a pending exam date change request.
                      </div>
                  </div>
              `;
          }
          
          return `
              <div class="exam-change-section">
                  <div class="alert alert-warning mb-3">
                      <i class="fas fa-exclamation-triangle me-2"></i>
                      Your exam date (${formatDate(application.examDate)}) has expired.
                  </div>
                  <button class="btn btn-primary" onclick="showExamChangeRequestModal(${application.id}, '${application.examDate}')">
                      <i class="fas fa-calendar-alt me-2"></i>Request Exam Date Change
                  </button>
              </div>
          `;
      } catch (error) {
          console.error('Error checking pending request:', error);
          return `
              <div class="exam-change-section">
                  <div class="alert alert-warning mb-3">
                      <i class="fas fa-exclamation-triangle me-2"></i>
                      Your exam date (${formatDate(application.examDate)}) has expired.
                  </div>
                  <button class="btn btn-primary" onclick="showExamChangeRequestModal(${application.id}, '${application.examDate}')">
                      <i class="fas fa-calendar-alt me-2"></i>Request Exam Date Change
                  </button>
              </div>
          `;
      }
  }


  async function getExamChangeSpecificContent(application, additionalInfo) {
      const examChangeButtonHTML = await getExamChangeButtonHTML(application);
      
      if (examChangeButtonHTML) {
          return `
              <div class="status-specific-section">
                  <h6><i class="fas fa-calendar-check me-2"></i>Exam Schedule</h6>
                  ${examChangeButtonHTML}
              </div>
          `;
      }
      
      return '';
  }

  // Utility function to format dates (if not already exists)
  // function formatDate(dateString) {
  //     if (!dateString) return 'N/A';
  //     const date = new Date(dateString);
  //     return date.toLocaleDateString('en-US', {
  //         year: 'numeric',
  //         month: 'short',
  //         day: 'numeric'
  //     });
  // }

  // function formatDateTime(dateString) {
  //     if (!dateString) return 'N/A';
  //     const date = new Date(dateString);
  //     return date.toLocaleString('en-US', {
  //         year: 'numeric',
  //         month: 'short',
  //         day: 'numeric',
  //         hour: '2-digit',
  //         minute: '2-digit'
  //     });
  // }

  function getTrialExamDetails(writtenExamId) {
      return $.ajax({
          url: `${API_BASE_URL}/trial-exams/written-exam/${writtenExamId}`,
          method: "GET",
          headers: {
              Authorization: "Bearer " + (localStorage.getItem("smartreg_token") || sessionStorage.getItem("smartreg_token")),
              "Content-Type": "application/json",
          },
      })
      .then(function (trialExams) {
          console.log("Trial exams response:", trialExams);
        
          if (trialExams && Array.isArray(trialExams) && trialExams.length > 0) {
              const latestTrial = trialExams.reduce((latest, current) => {
                  const currentDate = new Date(current.trialDate || 0);
                  const latestDate = new Date(latest.trialDate || 0);
                  return currentDate > latestDate ? current : latest;
              }, trialExams[0]);
              return latestTrial;
          }
          
          return trialExams || null;
      })
      .catch(function (error) {
          console.error("Failed to get trial exam details:", error);
          return null;
      });
  }

  $("#licencePreview").on('click', handleClickLicensePreviewBtn);

  async function handleClickLicensePreviewBtn() {
    
      showLoadingSpinner();
      
      const smartUserString = localStorage.getItem("smartreg_user");
      if (!smartUserString) {
          console.error("No user found in localStorage");
          hideLoadingSpinner();
          showAlert('error', 'User not found. Please log in again.');
          return;
      }

      const smartUser = JSON.parse(smartUserString);
      const userId = smartUser.id;

      const authToken = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");

      try {
          
          const applications = await makeAuthenticatedRequest({
              url: `${API_BASE_URL}/applications/getall`,
              method: 'GET',
              token: authToken
          });

          console.log("All applications:", applications);

          const userApplication = applications.find(app => app.driver && app.driverId === userId);

          if (!userApplication) {
              console.log("No application found for this user");
              hideLoadingSpinner();
              showAlert('warning', 'No application found for your account.');
              return;
          }

          console.log("User's application:", userApplication);
          const applicationId = userApplication.id;
          console.log("App Id: " + applicationId);

          const exam = await makeAuthenticatedRequest({
              url: `${API_BASE_URL}/written-exams/application/${applicationId}`,
              method: 'GET',
              token: authToken
          });

          console.log("Written Exam Data:", exam);
          const writtenExamId = exam.id;
          console.log("writtenExam Id: " + writtenExamId);

          if (!writtenExamId) {
              hideLoadingSpinner();
              showAlert('error', 'No exam found. Please complete your written exam first.');
              return;
          }

          const trialExamData = await getTrialExamDetails(writtenExamId);
          
          if (!trialExamData) {
              hideLoadingSpinner();
              showAlert('warning', 'No trial exam data found. Please complete your trial exam first.');
              return;
          }
          
          console.log('Trial exam data:', trialExamData);

          let licenseDetails = null;
          try {
              licenseDetails = await makeAuthenticatedRequest({
                  url: `${API_BASE_URL}/licenses/trial/${trialExamData.id}`,
                  method: 'GET',
                  token: authToken
              });
              console.log("License Details:", licenseDetails);
          } catch (licenseError) {
              console.warn("Could not fetch license details:", licenseError);
          }

          hideLoadingSpinner();

          let latestTrialExam = trialExamData;
          if (Array.isArray(trialExamData) && trialExamData.length > 0) {
              latestTrialExam = trialExamData.reduce((latest, current) => {
                  return new Date(current.trialDate) > new Date(latest.trialDate) ? current : latest;
              }, trialExamData[0]);
          }
          
          const trialResult = latestTrialExam.trialResult || latestTrialExam.result || 'not_complete';
          
          switch (trialResult.toLowerCase()) {
              case 'pass':
              case 'passed':
                  showLicensePreviewModal(latestTrialExam, exam, userApplication, licenseDetails);
                  break;
                  
              case 'fail':
              case 'failed':
                  showTrialFailedModal(latestTrialExam);
                  break;
                  
              case 'absent':
              case 'absant':
                  showTrialAbsentModal(latestTrialExam);
                  break;
                  
              default:
                  showTrialIncompleteModal();
                  break;
          }

      } catch (error) {
          hideLoadingSpinner();
          console.error('Error in handleClickLicensePreviewBtn:', error);
          
          if (error.status === 401 || error.status === 403) {
              showAlert('error', 'Authorization failed. Please log in again.');
          } else if (error.status === 404) {
              showAlert('warning', 'Required information not found. Please complete all exam steps first.');
          } else {
              showAlert('error', 'Failed to retrieve exam information. Please try again.');
          }
      }
  }

  // Helper function for authenticated requests
  async function makeAuthenticatedRequest({ url, method, token, data = null }) {
      return new Promise((resolve, reject) => {
          const ajaxConfig = {
              url: url,
              method: method,
              dataType: 'json',
              
              success: function(response) {
                  if (response && response.data) {
                    console.log("make Authentication Request: " + response.data);
                      resolve(response.data);
                  } else {
                    console.log("make Authentication Request else: ");
                      resolve(response);
                  }
              },
              error: function(xhr, status, error) {
                  console.error(`Request failed: ${method} ${url}`, {
                      status: xhr.status,
                      statusText: xhr.statusText,
                      response: xhr.responseText
                  });
                  reject({
                      status: xhr.status,
                      statusText: xhr.statusText,
                      message: error,
                      response: xhr.responseText
                  });
              }
          };

          if (token) {
              ajaxConfig.headers = {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
              };
          }

          if (data && (method === 'POST' || method === 'PUT')) {
              ajaxConfig.data = JSON.stringify(data);
          }

          $.ajax(ajaxConfig);
      });
  }

  // Updated license preview modal function
  function showLicensePreviewModal(trialExamData, exam, applications, licenseDetails) {
      const smartUser = JSON.parse(localStorage.getItem("smartreg_user"));
      const issueDate = trialExamData.trialDate;
      const expiryDate = new Date(issueDate);
      expiryDate.setFullYear(expiryDate.getFullYear() + 8);

      const licenseNumber = licenseDetails?.licenseNumber || 'Pending Generation';
      const showActions = licenseDetails && licenseDetails.licenseNumber;

      Swal.fire({
          title: '🎉 License Preview',
          html: `
              <div class="license-preview-modal">
                  <div class="success-banner">
                      <i class="fas fa-trophy me-2"></i>
                      <strong>Congratulations!</strong>
                      <p>You have successfully passed both written and trial exams!</p>
                  </div>
                  
                  <div class="license-card">
                      <div class="license-header">
                          <i class="fas fa-id-card me-2"></i>
                          <h5>Driving License Preview</h5>
                      </div>
                      
                      <div class="license-details">
                          <div class="row">
                              <div class="col-md-6">
                                  <div class="detail-group">
                                      <label>License Number:</label>
                                      <span class="${licenseDetails ? 'badge-success' : 'badge-pending'}">${licenseNumber}</span>
                                  </div>
                                  <div class="detail-group">
                                      <label>Name:</label>
                                      <span>${smartUser.fullName || 'N/A'}</span>
                                  </div>
                                  <div class="detail-group">
                                      <label>Issue Date:</label>
                                      <span>${formatDate(trialExamData.trialDate)}</span>
                                  </div>
                              </div>
                              <div class="col-md-6">
                                  <div class="detail-group">
                                      <label>License Type:</label>
                                      <span>${applications.licenseType || 'N/A'}</span>
                                  </div>
                                  <div class="detail-group">
                                      <label>Vehicle Class:</label>
                                      <span>${applications.vehicleClasses || 'N/A'}</span>
                                  </div>
                                  <div class="detail-group">
                                      <label>Expire Date:</label>
                                      <span>${formatDate(expiryDate)}</span>
                                  </div>
                              </div>
                          </div>
                      </div>
                      
                      ${showActions ? `
                      <div class="license-actions">
                          <button class="btn btn-success me-2" onclick="generateLicense(${trialExamData.id})">
                              <i class="fas fa-download me-1"></i> Generate License
                          </button>
                          <button class="btn btn-primary" onclick="printLicense(${licenseDetails.id})">
                              <i class="fas fa-print me-1"></i> Print Preview
                          </button>
                      </div>
                      ` : `
                      <div class="license-actions">
                          <div class="alert alert-info">
                              <i class="fas fa-info-circle me-2"></i>
                              License is being processed. Please contact the office for physical license collection.
                          </div>
                      </div>
                      `}
                  </div>
              </div>
              
              <style>
                  .license-preview-modal { text-align: left; }
                  
                  .success-banner {
                      background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                      color: white; text-align: center; padding: 20px;
                      border-radius: 10px; margin-bottom: 20px;
                      box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
                  }
                  .success-banner i { font-size: 1.5rem; }
                  .success-banner p { margin: 5px 0 0 0; opacity: 0.9; }
                  
                  .license-card {
                      background: #f8f9fa; border-radius: 10px; overflow: hidden;
                      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                  }
                  .license-header {
                      background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
                      color: white; padding: 15px; text-align: center;
                  }
                  .license-details { padding: 20px; }
                  .row { display: flex; gap: 20px; }
                  .col-md-6 { flex: 1; }
                  .detail-group {
                      display: flex; justify-content: space-between;
                      padding: 8px 0; border-bottom: 1px solid #e9ecef;
                  }
                  .detail-group label { font-weight: 600; color: #495057; }
                  .detail-group span { color: #6c757d; }
                  .badge-success {
                      background: #fbfbfbff; color: white;
                      border-radius: 12px; font-size: 0.85rem;
                  }
                  .badge-pending {
                      background: #ffc107; color: #212529; padding: 4px 8px;
                      border-radius: 12px; font-size: 0.85rem;
                  }
                  .license-actions {
                      padding: 20px; background: white; text-align: center;
                      border-top: 1px solid #e9ecef;
                  }
                  .alert {
                      padding: 12px; border-radius: 6px; margin: 0;
                  }
                  .alert-info {
                      background-color: #d1ecf1; border-color: #bee5eb; color: #0c5460;
                  }
                  .btn {
                      padding: 10px 20px; border: none; border-radius: 6px;
                      font-weight: 600; cursor: pointer; transition: all 0.3s;
                  }
                  .btn-success { background: #28a745; color: white; }
                  .btn-success:hover { background: #218838; }
                  .btn-primary { background: #007bff; color: white; }
                  .btn-primary:hover { background: #0056b3; }
                  .me-1 { margin-right: 4px; }
                  .me-2 { margin-right: 8px; }
              </style>
          `,
          showConfirmButton: false,
          showCloseButton: true,
          width: '600px',
          customClass: {
              closeButton: 'swal2-close-custom'
          }
      });
  }

  function showTrialFailedModal(trialExamData) {

    function getNextTrialDate(trialDate) {
          const failedDate = new Date(trialDate);
          const nextTrialDate = new Date(failedDate);
          nextTrialDate.setMonth(nextTrialDate.getMonth() + 3);
          return nextTrialDate;
      }

    const nextAvailableDate = getNextTrialDate(trialExamData.trialDate);

      Swal.fire({
          title: '❌ Trial Exam Failed',
          html: `
              <div class="trial-failed-modal">
                  <div class="failed-banner">
                      <i class="fas fa-times-circle me-2"></i>
                      <strong>Trial Exam Not Passed</strong>
                      <p>Don't worry! You can try again after the waiting period.</p>
                  </div>
                  
                  <div class="exam-result-card">
                      <div class="result-header">
                          <i class="fas fa-clipboard-list me-2"></i>
                          <h6>Exam Details</h6>
                      </div>
                      
                      <div class="result-details">
                          <div class="detail-item">
                              <i class="fas fa-calendar me-2"></i>
                              <span><strong>Date:</strong> ${formatDate(trialExamData.trialDate)}</span>
                          </div>
                          <div class="detail-item">
                              <i class="fas fa-times me-2"></i>
                              <span><strong>Result:</strong> <span class="badge-failed">FAILED</span></span>
                          </div>
                          ${trialExamData.examinerName ? `
                              <div class="detail-item">
                                  <i class="fas fa-user-tie me-2"></i>
                                  <span><strong>Examiner:</strong> ${trialExamData.examinerName}</span>
                              </div>
                          ` : ''}
                          ${trialExamData.examinerNotes ? `
                              <div class="detail-item notes">
                                  <i class="fas fa-sticky-note me-2"></i>
                                  <span><strong>Examiner Notes:</strong><br>${trialExamData.examinerNotes}</span>
                              </div>
                          ` : ''}
                          <div class="detail-item next-trial">
                              <i class="fas fa-calendar-plus me-2 text-info"></i>
                              <span><strong>Next Trial Available From:</strong> <span class="next-date">${formatDate(nextAvailableDate)}</span></span>
                          </div>
                      </div>
                  </div>
                  
                  <div class="retry-section">
                      <h6><i class="fas fa-redo me-2"></i>Next Steps</h6>
                      <ul class="next-steps-list">
                          <li>Review your performance and practice more</li>
                          <li>Wait for the 3-month period to complete</li>
                          <li>Contact the administration to schedule a new trial exam after ${formatDate(nextAvailableDate)}</li>
                          <li>Prepare thoroughly before your next attempt</li>
                          <li>Consider taking additional driving lessons if needed</li>
                      </ul>
                      
                      <div class="waiting-period-notice">
                          <i class="fas fa-clock text-warning me-2"></i>
                          <strong>Waiting Period:</strong> You must wait 3 months from your last failed attempt before applying for a new trial exam.
                      </div>
                      
                      <button class="btn btn-primary retry-btn" onclick="applyForTrialExam(${trialExamData.writtenExamId || 'null'})">
                          <i class="fas fa-calendar-plus me-1"></i> Apply for New Trial Exam (After ${formatDate(nextAvailableDate)})
                      </button>
                  </div>
              </div>
              
              <style>
                  .trial-failed-modal { text-align: left; }
                  
                  .failed-banner {
                      background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
                      color: white; text-align: center; padding: 20px;
                      border-radius: 10px; margin-bottom: 20px;
                  }
                  .failed-banner p { margin: 5px 0 0 0; opacity: 0.9; }
                  
                  .exam-result-card {
                      background: #f8f9fa; border-radius: 10px; padding: 20px;
                      margin-bottom: 20px; border-left: 4px solid #dc3545;
                  }
                  .result-header { 
                      color: #dc3545; margin-bottom: 15px; 
                      display: flex; align-items: center;
                  }
                  .result-details .detail-item {
                      display: flex; align-items: flex-start; margin-bottom: 10px;
                      color: #495057;
                  }
                  .detail-item.notes { flex-direction: column; }
                  .detail-item.notes span { margin-left: 0; margin-top: 5px; }
                  .detail-item.next-trial {
                      background: #e3f2fd; padding: 10px; border-radius: 5px;
                      border-left: 3px solid #2196f3; margin-top: 10px;
                  }
                  .next-date { color: #1976d2; font-weight: 600; }
                  .badge-failed {
                      background: #dc3545; color: white; padding: 4px 8px;
                      border-radius: 12px; font-size: 0.85rem;
                  }
                  
                  .retry-section {
                      background: #e3f2fd; padding: 20px; border-radius: 10px;
                  }
                  .retry-section h6 { color: #1976d2; margin-bottom: 15px; }
                  .next-steps-list {
                      margin: 15px 0; padding-left: 20px; color: #495057;
                  }
                  .next-steps-list li { margin-bottom: 8px; }
                  .waiting-period-notice {
                      background: #fff3cd; padding: 12px; border-radius: 6px;
                      margin-bottom: 15px; color: #856404; border: 1px solid #ffeaa7;
                  }
                  .retry-btn {
                      background: #007bff; color: white; padding: 10px 20px;
                      border: none; border-radius: 6px; font-weight: 600;
                      cursor: pointer; transition: all 0.3s;
                  }
                  .retry-btn:hover { background: #0056b3; }
                  .me-1 { margin-right: 4px; }
                  .me-2 { margin-right: 8px; }
              </style>
          `,
          confirmButtonText: '<i class="fas fa-times me-2"></i>Close',
          confirmButtonColor: "#6c757d",
          width: '600px'
      });
  }

  // Function to show trial absent modal with 3-month waiting period
  function showTrialAbsentModal(trialExamData) {

    function getNextTrialDate(trialDate) {
          const absentDate = new Date(trialDate);
          const nextTrialDate = new Date(absentDate);
          nextTrialDate.setMonth(nextTrialDate.getMonth() + 3);
          return nextTrialDate;
      }

      const nextAvailableDate = getNextTrialDate(trialExamData.trialDate);

      Swal.fire({
          title: '⚠️ Trial Exam - Absent',
          html: `
              <div class="trial-absent-modal">
                  <div class="absent-banner">
                      <i class="fas fa-user-slash me-2"></i>
                      <strong>Marked as Absent</strong>
                      <p>You were not present for your scheduled trial exam.</p>
                  </div>
                  
                  <div class="exam-info-card">
                      <div class="info-header">
                          <i class="fas fa-info-circle me-2"></i>
                          <h6>Scheduled Exam Details</h6>
                      </div>
                      
                      <div class="info-details">
                          <div class="detail-item">
                              <i class="fas fa-calendar me-2"></i>
                              <span><strong>Date:</strong> ${formatDate(trialExamData.trialDate)}</span>
                          </div>
                          <div class="detail-item">
                              <i class="fas fa-clock me-2"></i>
                              <span><strong>Time:</strong> ${trialExamData.trialTime || 'Not specified'}</span>
                          </div>
                          <div class="detail-item">
                              <i class="fas fa-map-marker-alt me-2"></i>
                              <span><strong>Location:</strong> ${trialExamData.trialLocation || 'Not specified'}</span>
                          </div>
                          <div class="detail-item">
                              <i class="fas fa-exclamation-triangle me-2"></i>
                              <span><strong>Status:</strong> <span class="badge-absent">ABSENT</span></span>
                          </div>
                          <div class="detail-item next-trial">
                              <i class="fas fa-calendar-plus me-2 text-info"></i>
                              <span><strong>Next Trial Available From:</strong> <span class="next-date">${formatDate(nextAvailableDate)}</span></span>
                          </div>
                      </div>
                  </div>
                  
                  <div class="reschedule-section">
                      <h6><i class="fas fa-calendar-plus me-2"></i>Reschedule Your Exam</h6>
                      <p>To proceed with getting your license, you need to reschedule and attend your trial exam after the waiting period.</p>
                      
                      <div class="waiting-period-notice">
                          <i class="fas fa-clock text-warning me-2"></i>
                          <strong>Waiting Period:</strong> You must wait 3 months from your absence before applying for a new trial exam.
                      </div>
                      
                      <div class="important-note">
                          <i class="fas fa-bell me-2"></i>
                          <strong>Important:</strong> Please ensure you attend your next scheduled exam to avoid further delays.
                      </div>
                      
                      <button class="btn btn-warning reschedule-btn" onclick="applyForTrialExam(${trialExamData.writtenExamId || 'null'})">
                          <i class="fas fa-calendar-alt me-1"></i> Reschedule Trial Exam (After ${formatDate(nextAvailableDate)})
                      </button>
                  </div>
              </div>
              
              <style>
                  .trial-absent-modal { text-align: left; }
                  
                  .absent-banner {
                      background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%);
                      color: #212529; text-align: center; padding: 20px;
                      border-radius: 10px; margin-bottom: 20px;
                  }
                  .absent-banner p { margin: 5px 0 0 0; opacity: 0.8; }
                  
                  .exam-info-card {
                      background: #f8f9fa; border-radius: 10px; padding: 20px;
                      margin-bottom: 20px; border-left: 4px solid #ffc107;
                  }
                  .info-header { 
                      color: #856404; margin-bottom: 15px; 
                      display: flex; align-items: center;
                  }
                  .info-details .detail-item {
                      display: flex; align-items: center; margin-bottom: 10px;
                      color: #495057;
                  }
                  .detail-item.next-trial {
                      background: #e3f2fd; padding: 10px; border-radius: 5px;
                      border-left: 3px solid #2196f3; margin-top: 10px;
                  }
                  .next-date { color: #1976d2; font-weight: 600; }
                  .badge-absent {
                      background: #ffc107; color: #212529; padding: 4px 8px;
                      border-radius: 12px; font-size: 0.85rem; font-weight: 600;
                  }
                  
                  .reschedule-section {
                      background: #fff3cd; padding: 20px; border-radius: 10px;
                      border: 1px solid #ffeaa7;
                  }
                  .reschedule-section h6 { color: #856404; margin-bottom: 10px; }
                  .reschedule-section p { color: #6c757d; margin-bottom: 15px; }
                  .waiting-period-notice {
                      background: #ffeaa7; padding: 12px; border-radius: 6px;
                      margin-bottom: 15px; color: #856404; border: 1px solid #f0c649;
                  }
                  .important-note {
                      background: #d1ecf1; padding: 12px; border-radius: 6px;
                      margin-bottom: 15px; color: #0c5460;
                  }
                  .reschedule-btn {
                      background: #ffc107; color: #212529; padding: 10px 20px;
                      border: none; border-radius: 6px; font-weight: 600;
                      cursor: pointer; transition: all 0.3s;
                  }
                  .reschedule-btn:hover { background: #e0a800; }
                  .me-1 { margin-right: 4px; }
                  .me-2 { margin-right: 8px; }
              </style>
          `,
          confirmButtonText: '<i class="fas fa-times me-2"></i>Close',
          confirmButtonColor: "#6c757d",
          width: '600px'
      });
  }

  // Function to show trial incomplete modal
  function showTrialIncompleteModal() {
      Swal.fire({
          title: '📋 Trial Exam Incomplete',
          html: `
              <div class="trial-incomplete-modal">
                  <div class="incomplete-banner">
                      <i class="fas fa-clock me-2"></i>
                      <strong>Trial Exam Not Completed</strong>
                      <p>You need to complete your trial exam to generate your license.</p>
                  </div>
                  
                  <div class="steps-card">
                      <div class="steps-header">
                          <i class="fas fa-list-ol me-2"></i>
                          <h6>Steps to Complete</h6>
                      </div>
                      
                      <div class="steps-list">
                          <div class="step-item completed">
                              <i class="fas fa-check-circle me-2"></i>
                              <span>✅ Written exam passed</span>
                          </div>
                          <div class="step-item pending">
                              <i class="fas fa-clock me-2"></i>
                              <span>⏳ Trial exam - Pending</span>
                          </div>
                          <div class="step-item disabled">
                              <i class="fas fa-id-card me-2"></i>
                              <span>🎯 License generation</span>
                          </div>
                      </div>
                  </div>
                  
                  <div class="action-section">
                      <h6><i class="fas fa-arrow-right me-2"></i>Next Action</h6>
                      <p>Apply for your trial exam to proceed with the license generation process.</p>
                      
                      <button class="btn btn-primary apply-btn" onclick="applyForTrialExam()">
                          <i class="fas fa-paper-plane me-1"></i> Apply for Trial Exam
                      </button>
                  </div>
              </div>
              
              <style>
                  .trial-incomplete-modal { text-align: left; }
                  
                  .incomplete-banner {
                      background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
                      color: white; text-align: center; padding: 20px;
                      border-radius: 10px; margin-bottom: 20px;
                  }
                  .incomplete-banner p { margin: 5px 0 0 0; opacity: 0.9; }
                  
                  .steps-card {
                      background: #f8f9fa; border-radius: 10px; padding: 20px;
                      margin-bottom: 20px; border-left: 4px solid #17a2b8;
                  }
                  .steps-header { 
                      color: #17a2b8; margin-bottom: 15px; 
                      display: flex; align-items: center;
                  }
                  .steps-list { }
                  .step-item {
                      display: flex; align-items: center; padding: 10px;
                      margin-bottom: 8px; border-radius: 6px;
                  }
                  .step-item.completed { 
                      background: #d4edda; color: #155724; 
                  }
                  .step-item.pending { 
                      background: #fff3cd; color: #856404; 
                  }
                  .step-item.disabled { 
                      background: #e2e3e5; color: #6c757d; 
                  }
                  
                  .action-section {
                      background: #e3f2fd; padding: 20px; border-radius: 10px;
                  }
                  .action-section h6 { color: #1976d2; margin-bottom: 10px; }
                  .action-section p { color: #495057; margin-bottom: 15px; }
                  .apply-btn {
                      background: #007bff; color: white; padding: 10px 20px;
                      border: none; border-radius: 6px; font-weight: 600;
                      cursor: pointer; transition: all 0.3s;
                  }
                  .apply-btn:hover { background: #0056b3; }
                  .me-1 { margin-right: 4px; }
                  .me-2 { margin-right: 8px; }
              </style>
          `,
          confirmButtonText: '<i class="fas fa-times me-2"></i>Close',
          confirmButtonColor: "#6c757d",
          width: '600px'
      });
  }

  // Keep existing utility functions
  function showLoadingSpinner() {
      $('#licencePreview').prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Loading...');
  }

  function hideLoadingSpinner() {
      $('#licencePreview').prop('disabled', false).html('<i class="fas fa-eye"></i> License Preview');
  }

  function showAlert(type, message) {
      const alertClass = {
          'success': 'alert-success',
          'error': 'alert-danger',
          'warning': 'alert-warning',
          'info': 'alert-info'
      };
      
      const alertHtml = `
          <div class="alert ${alertClass[type]} alert-dismissible fade show" role="alert">
              <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
              ${message}
              <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
          </div>
      `;
      
      $('#alertContainer').html(alertHtml);
      
      setTimeout(() => {
          $('.alert').fadeOut();
      }, 5000);
  }

  function generateLicense() {
      console.log('Generating license...');
      showAlert('info', 'License generation started...');
      // Add your license generation logic here
  }

  function printLicense() {
      console.log('Printing license...');
      window.print();
  }

  function getStatusSpecificContent(application, additionalInfo) {
      const { declineReason, examDetails } = additionalInfo;

      const getNextTrialDate = (trialDate) => {
          try {
             
              const dateObj = typeof trialDate === 'string' ? new Date(trialDate) : trialDate;
            
              if (isNaN(dateObj.getTime())) {
                  return 'To be announced';
              }
              
              const nextDate = new Date(dateObj);
              nextDate.setMonth(nextDate.getMonth() + 3);
              
              return nextDate.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
              });
          } catch (error) {
              console.error('Error calculating next trial date:', error);
              return 'To be announced';
          }
      };

      const updateTrialInfo = (trialDetails) => {
          console.log("Updating trial info:", trialDetails);
          
          const trialDateElement = document.querySelector('.trial-date-placeholder');
          const trialLocationElement = document.querySelector('.trial-location-placeholder');
          const trialTimeElement = document.querySelector('.trial-time-placeholder');
          const trialResultElement = document.querySelector('.trial-result-placeholder');
          
          [trialDateElement, trialLocationElement, trialTimeElement, trialResultElement].forEach(el => {
              if (el) {
                  el.style.color = '#6b7280';
                  el.style.fontWeight = '500';
              }
          });

          if (trialDetails.trialResult === "PENDING") {
          
              if (trialDateElement) {
                  trialDateElement.textContent = trialDetails.trialDate || 'To be announced';
                  trialDateElement.style.color = '#16a34a';
                  trialDateElement.style.fontWeight = '600';
              }
              if (trialLocationElement) {
                  trialLocationElement.textContent = trialDetails.trialLocation || 'To be announced';
                  trialLocationElement.style.color = '#16a34a';
                  trialLocationElement.style.fontWeight = '600';
              }
              if (trialTimeElement) {
                  trialTimeElement.textContent = trialDetails.trialTime || 'To be announced';
                  trialTimeElement.style.color = '#16a34a';
                  trialTimeElement.style.fontWeight = '600';
              }
              if (trialResultElement) {
                  trialResultElement.textContent = 'Pending';
                  trialResultElement.style.color = '#f59e0b';
                  trialResultElement.style.fontWeight = '600';
              }
              
          } else if (trialDetails.trialResult === "PASS") {
              
              if (trialDateElement) {
                  trialDateElement.textContent = trialDetails.trialDate || 'Completed';
                  trialDateElement.style.color = '#16a34a';
              }
              if (trialLocationElement) {
                  trialLocationElement.textContent = trialDetails.trialLocation || 'Completed';
                  trialLocationElement.style.color = '#16a34a';
              }
              if (trialTimeElement) {
                  trialTimeElement.textContent = trialDetails.trialTime || 'Completed';
                  trialTimeElement.style.color = '#16a34a';
              }
              if (trialResultElement) {
                  trialResultElement.textContent = 'Passed ✓';
                  trialResultElement.style.color = '#16a34a';
                  trialResultElement.style.fontWeight = '600';
              }
              
          } else if (trialDetails.trialResult === "FAIL") {
             
              const nextTrialDate = getNextTrialDate(trialDetails.trialDate || trialDetails.trialExamData);
              
              if (trialDateElement) {
                  trialDateElement.textContent = `Next Trial: ${nextTrialDate}`;
                  trialDateElement.style.color = '#dc2626';
                  trialDateElement.style.fontWeight = '600';
              }
              if (trialLocationElement) {
                  trialLocationElement.textContent = trialDetails.trialLocation || 'To be announced';
                  trialLocationElement.style.color = '#dc2626';
              }
              if (trialTimeElement) {
                  trialTimeElement.textContent = trialDetails.trialTime || 'To be announced';
                  trialTimeElement.style.color = '#dc2626';
              }
              if (trialResultElement) {
                  trialResultElement.textContent = 'Failed Trial - Retry Available';
                  trialResultElement.style.color = '#dc2626';
                  trialResultElement.style.fontWeight = '600';
              }
              
          } else if (trialDetails.trialResult === "ABSENT") {
              
              const nextTrialDate = getNextTrialDate(trialDetails.trialDate || trialDetails.trialExamData);
              
              if (trialDateElement) {
                  trialDateElement.textContent = `Next Trial: ${nextTrialDate}`;
                  trialDateElement.style.color = '#f59e0b';
                  trialDateElement.style.fontWeight = '600';
              }
              if (trialLocationElement) {
                  trialLocationElement.textContent = trialDetails.trialLocation || 'To be announced';
                  trialLocationElement.style.color = '#f59e0b';
              }
              if (trialTimeElement) {
                  trialTimeElement.textContent = trialDetails.trialTime || 'To be announced';
                  trialTimeElement.style.color = '#f59e0b';
              }
              if (trialResultElement) {
                  trialResultElement.textContent = 'Absent Trial - Retry Available';
                  trialResultElement.style.color = '#f59e0b';
                  trialResultElement.style.fontWeight = '600';
              }
              
          } else {
              
              [trialDateElement, trialLocationElement, trialTimeElement, trialResultElement].forEach(el => {
                  if (el) {
                      el.textContent = 'To be announced';
                      el.style.color = '#6b7280';
                      el.style.fontWeight = '500';
                  }
              });
          }
      };

      if (examDetails && examDetails.id) {
          getTrialExamDetails(examDetails.id)
              .then(updateTrialInfo)
              .catch(error => {
                  console.error("Error fetching trial details:", error);
                  updateTrialInfo(null);
              });
      }

      switch (application.status) {
          case "REJECTED":
              return `
                  <div class="status-specific-section rejection-section" style="
                      background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
                      border: 2px solid #fca5a5;
                      border-radius: 16px;
                      padding: 24px;
                      margin: 16px 0;
                      box-shadow: 0 10px 25px rgba(239, 68, 68, 0.1);
                  ">
                      <h6 style="color: #dc2626; font-size: 20px; font-weight: 700; margin-bottom: 20px; display: flex; align-items: center;">
                          <i class="fas fa-times-circle" style="margin-right: 12px; font-size: 24px;"></i>
                          Application Rejected
                      </h6>
                      
                      <div class="rejection-content">
                          <div style="background: white; border-radius: 12px; padding: 20px; margin-bottom: 16px; border-left: 4px solid #dc2626; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                              <h7 style="color: #374151; font-weight: 600; font-size: 16px; display: block; margin-bottom: 8px;">
                                  <strong>Reason for Rejection:</strong>
                              </h7>
                              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0; background: #f9fafb; padding: 12px; border-radius: 8px;">
                                  ${declineReason?.declineReason || "No specific reason provided. Please contact support for details."}
                              </p>
                          </div>
                          
                          <div style="background: white; border-radius: 12px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #dc2626; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                              <h7 style="color: #374151; font-weight: 600; font-size: 16px; display: block; margin-bottom: 8px;">
                                  <strong>Note For You:</strong>
                              </h7>
                              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0; background: #f9fafb; padding: 12px; border-radius: 8px;">
                                  ${declineReason?.declineNotes || "No specific Note provided. Please contact support for details."}
                              </p>
                          </div>
                          
                          <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                              <button onclick="Swal.close(); showLicenseForm();" style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); border: none; color: white; padding: 12px 24px; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3); display: flex; align-items: center; font-size: 14px;">
                                  <i class="fas fa-plus" style="margin-right: 8px;"></i>Submit New Application
                              </button>
                          </div>
                      </div>
                  </div>
              `;

          case "APPROVED":
              if (examDetails) {
                  const hasPassed = examDetails.writtenExamResult === "PASS";
                  const hasFailed = examDetails.writtenExamResult === "FAIL";
                  const hasAbsant = examDetails.writtenExamResult === "ABSENT";
                  const hasTrialExams = examDetails.trialExams && examDetails.trialExams.length > 0;
                  const latestTrialExam = hasTrialExams ? 
                      examDetails.trialExams.reduce((latest, current) => {
                          const currentDate = new Date(current.trialDate || 0);
                          const latestDate = new Date(latest.trialDate || 0);
                          return currentDate > latestDate ? current : latest;
                      }, examDetails.trialExams[0]) : null;
                  const hasPassedTrial = latestTrialExam && latestTrialExam.trialResult === "PASS";
                  const isComplete = hasPassed && hasPassedTrial;

                  return `
                      <div class="status-specific-section approval-section" style="
                          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                          border: 2px solid #86efac;
                          border-radius: 16px;
                          padding: 24px;
                          margin: 16px 0;
                          box-shadow: 0 10px 25px rgba(34, 197, 94, 0.15);
                      ">
                          <h6 style="color: #16a34a; font-size: 20px; font-weight: 700; margin-bottom: 20px; display: flex; align-items: center;">
                              <i class="fas fa-check-circle" style="margin-right: 12px; font-size: 24px;"></i>
                              Application Approved - ${isComplete ? 'Process Complete' : (hasPassed ? 'Exam Passed' : 'Exam Scheduled')}
                          </h6>
                          
                          ${isComplete ? `
                              <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; text-align: center; box-shadow: 0 8px 20px rgba(22, 163, 74, 0.3);">
                                  <i class="fas fa-trophy" style="font-size: 32px; margin-bottom: 10px; display: block;"></i>
                                  <strong style="font-size: 18px;">Congratulations!</strong>
                                  <p style="margin: 8px 0 0 0; opacity: 0.9;">You have successfully completed both written and practical exams.</p>
                              </div>
                          ` : ''}
                          
                          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 20px;">
                              
                              <!-- Written Exam Date (only if scheduled and not passed yet) -->
                              ${!hasPassed && examDetails.writtenExamDate ? `
                                  <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); border-left: 4px solid #3b82f6;">
                                      <div style="color: #3b82f6; font-size: 24px; margin-bottom: 12px;">
                                          <i class="fas fa-calendar-alt"></i>
                                      </div>
                                      <div>
                                          <label style="color: #6b7280; font-size: 14px; font-weight: 500; display: block; margin-bottom: 6px; text-transform: uppercase;">
                                              ${hasFailed || hasAbsant ? 'Last Exam Date' : 'Written Exam Date'}
                                          </label>
                                          <strong style="color: #1f2937; font-size: 16px; font-weight: 600;">
                                              ${formatDate(examDetails.writtenExamDate)}
                                          </strong>
                                      </div>
                                  </div>
                              ` : ''}

                              <!-- Written Exam Time (only if scheduled and not passed yet) -->
                              ${!hasPassed && examDetails.writtenExamTime ? `
                                  <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); border-left: 4px solid #f59e0b;">
                                      <div style="color: #f59e0b; font-size: 24px; margin-bottom: 12px;">
                                          <i class="fas fa-clock"></i>
                                      </div>
                                      <div>
                                          <label style="color: #6b7280; font-size: 14px; font-weight: 500; display: block; margin-bottom: 6px; text-transform: uppercase;">
                                              Written Exam Time
                                          </label>
                                          <strong style="color: #1f2937; font-size: 16px; font-weight: 600;">
                                              ${examDetails.writtenExamTime}
                                          </strong>
                                      </div>
                                  </div>
                              ` : ''}

                              <!-- Written Exam Location (only if scheduled and not passed yet) -->
                              ${!hasPassed && examDetails.writtenExamLocation ? `
                                  <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); border-left: 4px solid #dc2626; grid-column: 1 / -1;">
                                      <div style="color: #dc2626; font-size: 24px; margin-bottom: 12px;">
                                          <i class="fas fa-map-marker-alt"></i>
                                      </div>
                                      <div>
                                          <label style="color: #6b7280; font-size: 14px; font-weight: 500; display: block; margin-bottom: 6px; text-transform: uppercase;">
                                              Written Exam Location
                                          </label>
                                          <strong style="color: #1f2937; font-size: 16px; font-weight: 600;">
                                              ${examDetails.writtenExamLocation}
                                          </strong>
                                      </div>
                                  </div>
                              ` : ''}

                              <!-- Next Exam Date (only if failed) -->
                              ${( hasFailed || hasAbsant ) && examDetails.nextExamDate ? `
                                  <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); border-left: 4px solid #f59e0b;">
                                      <div style="color: #f59e0b; font-size: 24px; margin-bottom: 12px;">
                                          <i class="fas fa-calendar-alt"></i>
                                      </div>
                                      <div>
                                          <label style="color: #6b7280; font-size: 14px; font-weight: 500; display: block; margin-bottom: 6px; text-transform: uppercase;">
                                              Next Exam Date
                                          </label>
                                          <strong style="color: #1f2937; font-size: 16px; font-weight: 600;">
                                              ${formatDate(examDetails.nextExamDate)}
                                          </strong>
                                      </div>
                                  </div>
                              ` : ''}
                              
                              <!-- Notes -->
                              ${examDetails.note ? `
                                  <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); border-left: 4px solid #facc15; grid-column: 1 / -1;">
                                      <div style="color: #facc15; font-size: 24px; margin-bottom: 12px;">
                                          <i class="fas fa-sticky-note"></i>
                                      </div>
                                      <div>
                                          <label style="color: #6b7280; font-size: 14px; font-weight: 500; display: block; margin-bottom: 6px; text-transform: uppercase;">
                                              Notes
                                          </label>
                                          <strong style="color: #1f2937; font-size: 16px; font-weight: 600; line-height: 1.5;">
                                              ${examDetails.note}
                                          </strong>
                                      </div>
                                  </div>
                              ` : ''}
                              
                              <!-- Exam Result (only if available) -->
                              ${examDetails.writtenExamResult ? `
                                  <div style="
                                      background: ${examDetails.writtenExamResult === "PASS" ? 
                                          "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)" : 
                                          examDetails.writtenExamResult === "FAIL" || examDetails.writtenExamResult === "ABSANT" ? 
                                          "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)" : 
                                          "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)"
                                      };
                                      border: 2px solid ${examDetails.writtenExamResult === "PASS" ? "#16a34a" : examDetails.writtenExamResult === "FAIL"|| examDetails.writtenExamResult === "ABSANT" ? "#dc2626" : "#f59e0b"};
                                      border-radius: 16px;
                                      padding: 24px;
                                      margin: 20px 0;
                                      box-shadow: 0 8px 20px ${examDetails.writtenExamResult === "PASS" ? "rgba(22, 163, 74, 0.2)" : examDetails.writtenExamResult === "FAIL" || examDetails.writtenExamResult === "ABSANT" ? "rgba(220, 38, 38, 0.2)" : "rgba(245, 158, 11, 0.2)"};
                                      grid-column: 1 / -1;
                                      display: flex;
                                      align-items: center;
                                  ">
                                      <div style="font-size: 48px; color: ${examDetails.writtenExamResult === "PASS" ? "#16a34a" : examDetails.writtenExamResult === "FAIL" || examDetails.writtenExamResult === "ABSANT"? "#dc2626" : "#f59e0b"}; margin-right: 20px;">
                                          <i class="fas fa-${examDetails.writtenExamResult === "PASS" ? "trophy" : examDetails.writtenExamResult === "FAIL" || examDetails.writtenExamResult === "ABSANT"? "times" : "clock"}"></i>
                                      </div>
                                      <div style="flex: 1;">
                                          <label style="display: block; font-size: 14px; color: #6b7280; margin-bottom: 8px; font-weight: 500; text-transform: uppercase;">
                                              Written Exam Result
                                          </label>
                                          <strong style="font-size: 32px; font-weight: 800; color: ${examDetails.writtenExamResult === "PASS" ? "#16a34a" : examDetails.writtenExamResult === "FAIL" || examDetails.writtenExamResult === "ABSANT" ? "#dc2626" : "#f59e0b"}; display: block; margin-bottom: 10px;">
                                              ${examDetails.writtenExamResult}
                                          </strong>
                                      </div>
                                  </div>
                              ` : ""}
                              
                              <!-- Trial Exam Result (if available) -->
                              ${hasTrialExams && latestTrialExam && latestTrialExam.trialResult ? `
                                  <div style="
                                      background: ${latestTrialExam.trialResult === "PASS" ? 
                                          "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)" : 
                                          latestTrialExam.trialResult === "FAIL" || latestTrialExam.trialResult === "ABSENT" ? 
                                          "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)" : 
                                          "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)"
                                      };
                                      border: 2px solid ${latestTrialExam.trialResult === "PASS" ? "#16a34a" : latestTrialExam.trialResult === "FAIL" || latestTrialExam.trialResult === "ABSENT" ? "#dc2626" : "#f59e0b"};
                                      border-radius: 16px;
                                      padding: 24px;
                                      margin: 20px 0;
                                      box-shadow: 0 8px 20px ${latestTrialExam.trialResult === "PASS" ? "rgba(22, 163, 74, 0.2)" : latestTrialExam.trialResult === "FAIL" || latestTrialExam.trialResult === "ABSENT" ? "rgba(220, 38, 38, 0.2)" : "rgba(245, 158, 11, 0.2)"};
                                      grid-column: 1 / -1;
                                      display: flex;
                                      align-items: center;
                                  ">
                                      <div style="font-size: 48px; color: ${latestTrialExam.trialResult === "PASS" ? "#16a34a" : latestTrialExam.trialResult === "FAIL" || latestTrialExam.trialResult === "ABSENT" ? "#dc2626" : "#f59e0b"}; margin-right: 20px;">
                                          <i class="fas fa-${latestTrialExam.trialResult === "PASS" ? "trophy" : latestTrialExam.trialResult === "FAIL" || latestTrialExam.trialResult === "ABSENT" ? "times" : "clock"}"></i>
                                      </div>
                                      <div style="flex: 1;">
                                          <label style="display: block; font-size: 14px; color: #6b7280; margin-bottom: 8px; font-weight: 500; text-transform: uppercase;">
                                              Trial Exam Result
                                          </label>
                                          <strong style="font-size: 32px; font-weight: 800; color: ${latestTrialExam.trialResult === "PASS" ? "#16a34a" : latestTrialExam.trialResult === "FAIL" || latestTrialExam.trialResult === "ABSENT" ? "#dc2626" : "#f59e0b"}; display: block; margin-bottom: 10px;">
                                              ${latestTrialExam.trialResult}
                                          </strong>
                                      </div>
                                  </div>
                              ` : ""}
                          </div>
                          
                          <!-- Trial Exam Application Section -->
                          ${hasPassed && !hasTrialExams ? `
                              <div style="background: linear-gradient(135deg, #e0f2fe 0%, #b3e5fc 100%); border: 2px solid #29b6f6; border-radius: 16px; padding: 24px; margin-bottom: 20px;">
                                  <div style="display: flex; align-items: center; margin-bottom: 16px; color: #0277bd;">
                                      <i class="fas fa-info-circle" style="font-size: 24px; margin-right: 12px;"></i>
                                      <strong style="font-size: 18px; font-weight: 700;">You've passed the written exam!</strong>
                                  </div>
                                  
                                  <div style="background: white; border-radius: 12px; padding: 16px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                                      <p style="margin: 0 0 8px 0; color: #374151; font-weight: 600;">
                                          <i class="fas fa-calendar" style="margin-right: 8px; color: #3b82f6;"></i>
                                          <b>Trial Date:</b> <span class="trial-date-placeholder" style="color: #6b7280;">${examDetails.trialDate || 'Loading...'}</span>
                                      </p>
                                      <p style="margin: 0 0 8px 0; color: #374151; font-weight: 600;">
                                          <i class="fas fa-clock" style="margin-right: 8px; color: #f59e0b;"></i>
                                          <b>Trial Time:</b> <span class="trial-time-placeholder" style="color: #6b7280;">Loading...</span>
                                      </p>
                                      <p style="margin: 0 0 8px 0; color: #374151; font-weight: 600;">
                                          <i class="fas fa-map-marker-alt" style="margin-right: 8px; color: #dc2626;"></i>
                                          <b>Trial Location:</b> <span class="trial-location-placeholder" style="color: #6b7280;">Loading...</span>
                                      </p>
                                      <p style="margin: 0; color: #374151; font-weight: 600;">
                                          <i class="fas fa-clipboard-check" style="margin-right: 8px; color: #16a34a;"></i>
                                          <b>Trial Result:</b> <span class="trial-result-placeholder" style="color: #6b7280;">Loading...</span>
                                      </p>
                                  </div>
                                  
                                  <button onclick="applyForTrialExam(${examDetails.id})" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border: none; color: white; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 16px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4); display: flex; align-items: center; justify-content: center; width: 100%;">
                                      <i class="fas fa-car" style="margin-right: 10px; font-size: 18px;"></i>
                                      Apply for Trial Exam
                                  </button>
                              </div>
                          ` : ''}
                          
                          <!-- Trial Retry Section -->
                          ${hasTrialExams && !hasPassedTrial ? `
                              <div style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border: 2px solid #fbbf24; border-radius: 16px; padding: 24px; margin-bottom: 20px;">
                                  <div style="display: flex; align-items: center; margin-bottom: 16px; color: #d97706;">
                                      <i class="fas fa-exclamation-triangle" style="font-size: 24px; margin-right: 12px;"></i>
                                      <strong style="font-size: 18px; font-weight: 700;">You didn't pass the practical exam. You can apply for another trial exam.</strong>
                                  </div>
                                  
                                  <div style="background: white; border-radius: 12px; padding: 16px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                                      <p style="margin: 0 0 8px 0; color: #374151; font-weight: 600;">
                                          <i class="fas fa-calendar" style="margin-right: 8px; color: #3b82f6;"></i>
                                          <b>Next Trial Date:</b> <span class="trial-date-placeholder" style="color: #6b7280;">Loading...</span>
                                      </p>
                                      <p style="margin: 0 0 8px 0; color: #374151; font-weight: 600;">
                                          <i class="fas fa-clock" style="margin-right: 8px; color: #f59e0b;"></i>
                                          <b>Trial Time:</b> <span class="trial-time-placeholder" style="color: #6b7280;">Loading...</span>
                                      </p>
                                      <p style="margin: 0 0 8px 0; color: #374151; font-weight: 600;">
                                          <i class="fas fa-map-marker-alt" style="margin-right: 8px; color: #dc2626;"></i>
                                          <b>Trial Location:</b> <span class="trial-location-placeholder" style="color: #6b7280;">Loading...</span>
                                      </p>
                                      <p style="margin: 0; color: #374151; font-weight: 600;">
                                          <i class="fas fa-clipboard-check" style="margin-right: 8px; color: #16a34a;"></i>
                                          <b>Trial Result:</b> <span class="trial-result-placeholder" style="color: #6b7280;">Loading...</span>
                                      </p>
                                  </div>
                                  
                                  <button onclick="applyForTrialExam(${examDetails.id})" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border: none; color: white; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 16px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 6px 16px rgba(245, 158, 11, 0.4); display: flex; align-items: center; justify-content: center; width: 100%;">
                                      <i class="fas fa-redo" style="margin-right: 10px; font-size: 18px;"></i>
                                      Apply for Retry
                                  </button>
                              </div>
                          ` : ''}
                          
                          <!-- Action Buttons -->
                          <div style="display: flex; gap: 16px; flex-wrap: wrap; justify-content: center;">
                              <button onclick="Swal.close(); showExamDetails(${JSON.stringify(examDetails).replace(/"/g, "&quot;")});" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border: none; color: white; padding: 12px 24px; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); display: flex; align-items: center; font-size: 14px; min-width: 180px; justify-content: center;">
                                  <i class="fas fa-info-circle" style="margin-right: 8px;"></i>Full Exam Details
                              </button>
                              
                              ${!hasPassed ? `
                                  <button onclick="Swal.close(); showPaymentForm();" style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); border: none; color: white; padding: 12px 24px; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3); display: flex; align-items: center; font-size: 14px; min-width: 180px; justify-content: center;">
                                      <i class="fas fa-credit-card" style="margin-right: 8px;"></i>Make Payment
                                  </button>
                              ` : ''}
                          </div>
                      </div>
                  `;
              }

          default:
              return "";
      }
  }


  // =================== UTILITY FUNCTIONS ===================

  function showLoading(show) {
    if (show) {
      if ($("#loadingOverlay").length === 0) {
        $("body").append(`
                    <div id="loadingOverlay" class="loading-overlay">
                        <div class="loading-spinner">
                            <div class="spinner-ring"></div>
                            <div class="loading-text">Loading...</div>
                        </div>
                    </div>
                `);
      }
    } else {
      $("#loadingOverlay").remove();
    }
  }

  function showAlert(title, message, type) {
    Swal.fire({
      title: title,
      text: message,
      icon: type,
      confirmButtonColor: type === "error" ? "#dc3545" : "#007bff",
    });
  }

  function handleUnauthorized() {
    localStorage.removeItem("smartreg_token");
    localStorage.removeItem("smartreg_user");
    sessionStorage.removeItem("smartreg_token");
    sessionStorage.removeItem("smartreg_user");

    Swal.fire({
      title: "Session Expired",
      text: "Your session has expired. Please login again to continue.",
      icon: "error",
      confirmButtonText: "Login",
      allowOutsideClick: false,
    }).then(() => {
      window.location.href = "../index.html";
    });
  }

  function updateNotificationBadge(count) {
    
    let badge = $("#notificationBadge");
    
    if (badge.length === 0) {
      badge = $(
        '<span id="notificationBadge" class="notification-badge"></span>'
      );
      $('a[href="#notifications"]').append(badge);
    }

    if (count > 0) {
      badge.text(count).show();
    } else {
      badge.hide();
    }
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function formatDateTime(dateString) {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatRelativeDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(dateString);
  }

  // =================== GLOBAL FUNCTIONS ===================

  window.logout = function () {
    Swal.fire({
      title: "Confirm Logout",
      text: "Are you sure you want to logout?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
      confirmButtonText: '<i class="fas fa-sign-out-alt me-2"></i>Yes, Logout',
      cancelButtonText: '<i class="fas fa-times me-2"></i>Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("email");
        localStorage.removeItem("smartreg_user");
        sessionStorage.removeItem("smartreg_token");
        localStorage.removeItem("smartreg_user_data");
        localStorage.removeItem("dashboard_filter");

        Swal.fire({
          title: "Logged Out",
          text: "You have been logged out successfully.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        }).then(() => {
          window.location.href = "../index.html";
        });
      }
    });
  };

  window.refreshDashboard = function () {
    showLoading(true);

    Promise.all([loadDriverApplications(), loadSmartNotifications()])
      .then(() => {
        showLoading(false);
        Swal.fire({
          title: "✅ Dashboard Refreshed",
          text: "All data has been updated successfully!",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      })
      .catch((error) => {
        showLoading(false);
        showAlert(
          "Refresh Failed",
          "Some data could not be updated. Please try again.",
          "warning"
        );
      });
  };

  // =================== EVENT HANDLERS ===================

  $(window).on("click", function (event) {
    const modal = $("#licenseModal")[0];
    if (event.target === modal) {
      closeLicenseModal();
    }
  });

  $(document).on("keydown", function (e) {
    if (e.key === "Escape" && $("#licenseModal").is(":visible")) {
      closeLicenseModal();
    }

    if ((e.ctrlKey || e.metaKey) && e.key === "r") {
      e.preventDefault();
      refreshDashboard();
    }
  });

  // Auto-refresh functionality
  function startAutoRefresh() {
    refreshInterval = setInterval(() => {
      if (!document.hidden) {
        loadSmartNotifications();
      }
    }, 3 * 60 * 1000); // 3 minutes
  }

  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) {
      loadSmartNotifications();
    }
  });

  window.addEventListener("beforeunload", function () {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
  });

  // =================== ENHANCED CSS STYLES ===================

  $("<style>")
    .text(
      `
        .loading-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); display: flex; justify-content: center;
            align-items: center; z-index: 9999; backdrop-filter: blur(3px);
        }
        .loading-spinner { text-align: center; color: white; }
        .spinner-ring {
            width: 60px; height: 60px; border: 4px solid #333;
            border-top: 4px solid #007bff; border-radius: 50%;
            animation: spin 1s linear infinite; margin: 0 auto 15px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .loading-text { font-size: 1.1rem; font-weight: 500; }

        .smart-notification-item {
            display: flex; align-items: flex-start; background: #ffffff;
            border-radius: 12px; margin-bottom: 15px; padding: 0;
            box-shadow: 0 2px 10px rgba(0,0,0,0.08); transition: all 0.3s ease;
            cursor: pointer; position: relative; overflow: hidden;
        }
        .smart-notification-item:hover {
            transform: translateY(-3px); box-shadow: 0 6px 20px rgba(0,0,0,0.15);
        }
        .smart-notification-item.unread {
            border-left: 4px solid #007bff;
            background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
        }
        .smart-notification-item.priority-urgent {
            border-left: 4px solid #dc3545; animation: urgentGlow 2s infinite;
        }
        .smart-notification-item.priority-high { border-left: 4px solid #fd7e14; }
        @keyframes urgentGlow {
            0%, 100% { box-shadow: 0 2px 10px rgba(0,0,0,0.08); }
            50% { box-shadow: 0 4px 20px rgba(220,53,69,0.3); }
        }

        .notification-icon {
            width: 50px; height: 50px; border-radius: 50%; display: flex;
            align-items: center; justify-content: center; margin: 20px 15px;
            color: white; font-size: 1.2rem; flex-shrink: 0;
        }
        .notification-content { flex: 1; padding: 20px 20px 20px 0; }
        .notification-header {
            display: flex; justify-content: space-between; align-items: flex-start;
            margin-bottom: 8px;
        }
        .notification-message {
            font-weight: 600; color: #2c3e50; line-height: 1.4; margin-right: 15px;
        }
        .notification-date {
            font-size: 0.8rem; color: #6c757d; flex-shrink: 0;
        }
        .notification-details {
            font-size: 0.9rem; color: #495057; line-height: 1.5;
            margin-bottom: 12px; background: #f8f9fa; padding: 12px;
            border-radius: 8px; white-space: pre-line;
        }
        .notification-action { margin-top: 12px; }
        .btn-notification-action {
            background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
            color: white; border: none; padding: 8px 16px; border-radius: 20px;
            font-size: 0.85rem; font-weight: 500; cursor: pointer;
            transition: all 0.3s ease;
        }
        .btn-notification-action:hover {
            transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,123,255,0.3);
        }
        .unread-indicator {
            position: absolute; top: 15px; right: 15px; width: 10px; height: 10px;
            background: #007bff; border-radius: 50%; animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.1); }
        }

        .empty-notifications {
            text-align: center; padding: 40px 20px; color: #6c757d;
        }
        .empty-icon { font-size: 3rem; margin-bottom: 15px; opacity: 0.5; }

        .notification-badge {
            position: absolute; top: -8px; right: -8px; background: #dc3545;
            color: white; border-radius: 50%; min-width: 18px; height: 18px;
            display: flex; align-items: center; justify-content: center;
            font-size: 0.75rem; font-weight: bold;
        }

        .summary-header {
            display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #e9ecef;
        }
        .summary-header h6 { margin: 0; color: #495057; font-weight: 600; }
        .summary-details { margin-bottom: 20px; }
        .summary-details p { margin-bottom: 8px; color: #6c757d; }
        .summary-actions { display: flex; flex-wrap: wrap; gap: 10px; }

        .status-active { background: #28a745; color: white; }
        .status-pending { background: #ffc107; color: #212529; }
        .status-rejected { background: #dc3545; color: white; }
        .status-none { background: #6c757d; color: white; }

        .section-title {
            color: #495057; font-weight: 600; margin-bottom: 20px;
            font-size: 1.1rem; display: flex; align-items: center;
        }
        .rejection-section { border-left-color: #dc3545; }
        .rejection-content { }
        .reason-display {
            background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
            padding: 20px; border-radius: 12px; margin-bottom: 20px;
            border-left: 4px solid #dc3545;
        }
        .reason-text {
            color: #721c24; font-weight: 500; margin: 10px 0 0 0;
            line-height: 1.5;
        }
        .rejection-actions { display: flex; flex-wrap: wrap; gap: 10px; }

        .approval-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px; }

        @media (max-width: 768px) {
            .smart-notification-item { margin-bottom: 12px; }
            .notification-icon { width: 40px; height: 40px; margin: 15px 10px; font-size: 1rem; }
            .notification-content { padding: 15px 15px 15px 0; }
            .notification-header { flex-direction: column; align-items: stretch; }
            .notification-message { margin-right: 0; margin-bottom: 5px; }
            .summary-actions { flex-direction: column; }
            .summary-actions .btn-card { width: 100%; text-align: center; }
        }
    `
    )
    .appendTo("head");

    

  // =================== INITIALIZATION ===================

  function initialize() {
    console.log("🚀 Enhanced Driver Dashboard initializing...");

    showLoading(true);

    // Set driver name
    $("#driverName").text(currentDriverName || "Driver");

    // Set date constraints for DOB
    const today = new Date();
    const eighteenYearsAgo = new Date(
      today.getFullYear() - 18,
      today.getMonth(),
      today.getDate()
    );
    $("#dateOfBirth").attr("max", eighteenYearsAgo.toISOString().split("T")[0]);

    // Initialize form state
    $("#vehicleClass").prop("disabled", true);
    selectedVehicleClasses = [];
    updateSelectedVehicleClassesDisplay();

    // Load initial data
    loadDriverApplications()
      .then(() => {
        return loadSmartNotifications();
      })
      .then(() => {
        showLoading(false);
        console.log("✅ Dashboard loaded successfully");

        // Show welcome message for first-time users
        if (currentApplications.length === 0) {
          setTimeout(() => {
            Swal.fire({
              title: "🎉 Welcome to LicensePro!",
              text: 'Ready to start your driving license journey? Click "Register License" to begin!',
              icon: "info",
              confirmButtonText: "Get Started",
              showCancelButton: true,
              cancelButtonText: "Later",
            }).then((result) => {
              if (result.isConfirmed) {
                showLicenseForm();
              }
            });
          }, 1000);
        }
      })
      .catch((error) => {
        showLoading(false);
        console.error("❌ Dashboard initialization failed:", error);
        showAlert(
          "Initialization Error",
          "Failed to load dashboard data. Please refresh the page.",
          "error"
        );
      });
  }

  // Start auto-refresh and initialize
  startAutoRefresh();
  initialize();

  console.log("🎯 Enhanced Driver Dashboard script loaded successfully");
  console.log(
    `👤 Current Driver: ${currentDriverName} (ID: ${currentDriverId})`
  );
  console.log(
    "🔐 Authentication token:",
    authToken ? "✅ Present" : "❌ Missing"
  );
  
});
