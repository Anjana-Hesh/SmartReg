  $(document).ready(function () {
        // =================== CONFIGURATION ===================
        const API_BASE_URL = "http://localhost:8080/api/v1";

        // Authentication data - check both localStorage and sessionStorage
        let authToken =
          localStorage.getItem("smartreg_token") ||
          sessionStorage.getItem("smartreg_token");
        let userData = null;

        try {
          const userDataString =
            localStorage.getItem("smartreg_user") ||
            sessionStorage.getItem("smartreg_user");
          userData = userDataString ? JSON.parse(userDataString) : null;
        } catch (e) {
          console.error("Error parsing user data:", e);
          userData = null;
        }

        const currentUserId = userData?.id;
        const currentUserName = userData?.fullName || userData?.name;
        const currentUserRole = userData?.role;

        // Global variables
        let currentApplications = [];
        let filteredApplications = [];
        let currentPage = 1;
        const applicationsPerPage = 10;

        console.log("Auth check:", {
          authToken: !!authToken,
          userId: currentUserId,
          role: currentUserRole,
        });

        // =================== AUTHENTICATION CHECK ===================
        function checkAuthentication() {
          if (!authToken || !currentUserId) {
            console.log("Authentication failed - redirecting to login");
            Swal.fire({
              title: "Authentication Required",
              text: "Please login to continue",
              icon: "error",
              confirmButtonText: "Login Now",
              allowOutsideClick: false,
            }).then(() => {
              window.location.href = "../index.html";
            });
            return false;
          }
          return true;
        }

        // Only proceed if authenticated
        if (!checkAuthentication()) {
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
            // Only handle auth errors, not all errors
            if (xhr.status === 401) {
              console.log("Unauthorized request - handling session expiry");
              handleUnauthorized();
            } else if (xhr.status === 403) {
              showAlert(
                "Access Denied",
                "You don't have permission to perform this action",
                "error"
              );
            }
            // Let individual requests handle other errors
          },
        });

        function handleUnauthorized() {
          console.log("Session expired - clearing storage and redirecting");
          // Clear both localStorage and sessionStorage
          localStorage.removeItem("smartreg_token");
          localStorage.removeItem("smartreg_user");
          sessionStorage.removeItem("smartreg_token");
          sessionStorage.removeItem("smartreg_user");

          // Only show alert if not already redirecting
          if (!window.location.href.includes("index.html")) {
            Swal.fire({
              title: "Session Expired",
              text: "Please login again",
              icon: "warning",
              confirmButtonText: "Login",
              allowOutsideClick: false,
            }).then(() => {
              window.location.href = "../index.html";
            });
          }
        }

        // =================== INITIALIZATION ===================
        initializeApp();
        setupEventListeners();
        setupBackButton();

        function initializeApp() {
          loadApplications();
        }

        window.changePage = function (page) {
          if (
            page < 1 ||
            page > Math.ceil(filteredApplications.length / applicationsPerPage)
          )
            return;
          currentPage = page;
          renderApplicationsList(filteredApplications);
          window.scrollTo({ top: 0, behavior: "smooth" });
        };

        window.viewApplicationDetails = viewApplicationDetails;
        window.editApplication = editApplication;
        window.updateExamResultModal = updateExamResultModal;
        window.scheduleExamModal = scheduleExamModal;
        window.saveExamResult = saveExamResult;
        window.sortApplications = sortApplications;
        window.applyFilters = applyFilters;

        // Add these new functions to the global scope
        window.updateTrialResultModal = updateTrialResultModal;
        window.saveTrialResult = saveTrialResult;

        // Auto-refresh data every 5 minutes
        setInterval(() => {
          loadApplications();
        }, 5 * 60 * 1000);

        function setupEventListeners() {
          // Search functionality
          $("#searchDriver").on(
            "input",
            debounce(function () {
              currentPage = 1;
              applyFilters();
            }, 300)
          );

          // Advanced filter toggle
          $("#advancedFilterBtn").click(function () {
            $("#advancedFilters").toggleClass("hidden");
          });

          // Exam result change handler
          $("#examResult").on("change", function () {
            const result = $(this).val();
            if (result === "PASS") {
              $("#trialDateContainer").show();
              $("#nextExamDateContainer").hide();
              $("#trialDate").prop("required", true);
              $("#nextExamDate").prop("required", false);
            } else if (result === "FAIL" || result === "ABSENT") {
              $("#trialDateContainer").hide();
              $("#nextExamDateContainer").show();
              $("#trialDate").prop("required", false);
              $("#nextExamDate").prop("required", true);
            } else {
              $("#trialDateContainer").hide();
              $("#nextExamDateContainer").hide();
              $("#trialDate").prop("required", false);
              $("#nextExamDate").prop("required", false);
            }
          });
        }

        function setupBackButton() {
          $("#backButton").click(function () {
            window.history.back();
          });
        }

        // =================== API CALLS ===================
        function loadApplications() {
          console.log(
            "Loading applications for user:",
            currentUserId,
            "Role:",
            currentUserRole
          );

          const loadingHtml = `
      <div class="loading-spinner">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Loading applications...</span>
        </div>
      </div>
    `;
          $("#applicationsList").html(loadingHtml);

          // Determine which endpoint to use based on user role
          const endpoint =
            currentUserRole === "ADMIN"
              ? `${API_BASE_URL}/applications/getall`
              : `${API_BASE_URL}/applications/driver/${currentUserId}`;

          console.log("Making API call to:", endpoint);

          $.ajax({
            url: endpoint,
            method: "GET",
            timeout: 10000, // 10 second timeout
            success: function (data) {
              console.log(
                "Applications loaded successfully:",
                data?.length || 0
              );
              currentApplications = data || [];

              // Load exam data for each application
              loadExamDataForApplications();
            },
            error: function (xhr, status, error) {
              console.error("Error loading applications:", {
                status: xhr.status,
                error,
                responseText: xhr.responseText,
              });

              // Don't show auth error here as it's handled globally
              if (xhr.status !== 401 && xhr.status !== 403) {
                $("#applicationsList").html(`
            <div class="alert alert-danger">
              <i class="fas fa-exclamation-triangle"></i>
              Failed to load applications. Please try again.
              <br><small>Error: ${error} (Status: ${xhr.status})</small>
            </div>
          `);
              }
            },
          });
        }

        function loadExamDataForApplications() {
          const promises = currentApplications.map((application) => {
            return $.ajax({
              url: `${API_BASE_URL}/written-exams/application/${application.id}`,
              method: "GET",
            })
              .then((writtenExamData) => {
                application.examData = writtenExamData;

                // Now load trial exam data if written exam exists
                if (writtenExamData && writtenExamData.id) {
                  return $.ajax({
                    url: `${API_BASE_URL}/trial-exams/written-exam/${writtenExamData.id}`,
                    method: "GET",
                  })
                    .then((trialExamData) => {
                      application.trialExamData = trialExamData;
                      return application;
                    })
                    .catch(() => {
                      application.trialExamData = null;
                      return application;
                    });
                } else {
                  application.trialExamData = null;
                  return application;
                }
              })
              .catch(() => {
                application.examData = null;
                application.trialExamData = null;
                return application;
              });
          });

          Promise.all(promises).then((applicationsWithExams) => {
            currentApplications = applicationsWithExams;
            renderApplicationsList();
            updateStats();
          });
        }

        function updateExamResult(examId, result, note) {
          const params = new URLSearchParams({
            result: result,
          });

          if (note && note.trim()) {
            params.append("note", note);
          }

          console.log("Updating exam result:", { examId, result, note });

          return $.ajax({
            url: `${API_BASE_URL}/written-exams/${examId}/result?${params.toString()}`,
            method: "PATCH",
            beforeSend: function (xhr) {
              if (authToken) {
                xhr.setRequestHeader("Authorization", "Bearer " + authToken);
              }
            },
            error: function (xhr, status, error) {
              console.error("Error updating exam result:", {
                status: xhr.status,
                statusText: xhr.statusText,
                responseText: xhr.responseText,
                error: error,
              });
              throw xhr;
            },
          });
        }

        function scheduleWrittenExam(
          applicationId,
          examDate,
          examTime,
          location,
          language = "ENGLISH"
        ) {
          const examData = {
            applicationId: applicationId,
            writtenExamDate: examDate,
            writtenExamTime: examTime,
            writtenExamLocation: location,
            examLanguage: language,
          };

          return $.ajax({
            url: `${API_BASE_URL}/written-exams/schedule`,
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(examData),
          });
        }

        // =================== RENDERING FUNCTIONS ===================
        function renderApplicationsList(
          applicationsToRender = currentApplications
        ) {
          filteredApplications = applicationsToRender;

          const container = $("#applicationsList");
          container.empty();

          if (filteredApplications.length === 0) {
            container.append(`
        <div class="alert alert-info">
          <i class="fas fa-info-circle"></i> No applications found matching your criteria
        </div>
      `);
            return;
          }

          const totalPages = Math.ceil(
            filteredApplications.length / applicationsPerPage
          );
          const startIndex = (currentPage - 1) * applicationsPerPage;
          const endIndex = Math.min(
            startIndex + applicationsPerPage,
            filteredApplications.length
          );
          const paginatedApplications = filteredApplications.slice(
            startIndex,
            endIndex
          );

          paginatedApplications.forEach((application) => {
            const card = createApplicationCard(application);
            container.append(card);
          });

          renderPagination(totalPages);
        }

        function createApplicationCard(application) {
          const statusClass = getStatusClass(application.status);
          const examStatus = application.examData
            ? application.examData.writtenExamResult
            : "PENDING";
          const examStatusBadge = getExamStatusBadge(examStatus);

          // Fix the property names to match your ApplicationDTO
          const fullName = application.driver || application.fullName || "N/A";
          const nicNumber = application.nicNumber || application.nic || "N/A";
          const submittedDate =
            application.submittedDate || application.applicationDate;

          return `
      <div class="driver-card mb-3" data-id="${application.id}">
        <div class="driver-info">
          <div>
            <div class="driver-name">${fullName}
              <span class="nic-display">${nicNumber}</span>
            </div>
            <div class="driver-license">Application #${
              application.id
            } • ${application.licenseType}</div>
          </div>
          <div>
            <span class="status-badge ${statusClass}">${application.status}</span>
          </div>
        </div>

        <div class="driver-stats">
          <div class="stat-item">
            <div class="stat-value">${formatDate(submittedDate)}</div>
            <div class="stat-label">Applied Date</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${application.licenseType}</div>
            <div class="stat-label">License Type</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${
              application.vehicleClasses
                ? application.vehicleClasses.join(", ")
                : "N/A"
            }</div>
            <div class="stat-label">Vehicle Classes</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${examStatusBadge}</div>
            <div class="stat-label">Exam Status</div>
          </div>
        </div>

        <div class="actions">
          <button class="btn btn-sm btn-primary" onclick="viewApplicationDetails(${
            application.id
          })">
            <i class="fas fa-eye"></i> View Details
          </button>
          ${currentUserRole === "ADMIN" ? getAdminActions(application) : ""}
        </div>
      </div>
    `;
        }

        function getStatusClass(status) {
          switch (status?.toLowerCase()) {
            case "approved":
              return "status-active";
            case "pending":
              return "status-pending";
            case "declined":
              return "status-expired";
            default:
              return "status-pending";
          }
        }

        function getExamStatusBadge(status) {
          switch (status?.toUpperCase()) {
            case "PASS":
              return '<span class="badge bg-success">Passed</span>';
            case "FAIL":
              return '<span class="badge bg-danger">Failed</span>';
            case "ABSENT":
              return '<span class="badge bg-warning">Absent</span>';
            case "PENDING":
            default:
              return '<span class="badge bg-secondary">Pending</span>';
          }
        }

        // <button class="btn btn-sm btn-warning" onclick="editApplication(${application.id})">
        //       <i class="fas fa-edit"></i> Edit
        //     </button>
        function getAdminActions(application) {
          let actions = "";
          const hasExam = application.examData && application.examData.id;
          const examResult = hasExam
            ? application.examData.writtenExamResult
            : null;
          const hasResult = examResult && examResult !== "PENDING";

          // Check if there's a trial exam record
          const hasTrialExam =
            application.trialExamData && application.trialExamData.id;
          const trialResult = hasTrialExam
            ? application.trialExamData.trialResult
            : null;
          const hasTrialResult = trialResult && trialResult !== "PENDING";

          // Add exam management actions
          if (hasExam) {
            if (hasResult) {
              // Disable the Update Result button after a result is set
              actions += `
                <button class="btn btn-sm btn-info" disabled>
                    <i class="fas fa-clipboard-check"></i> Result Submitted
                </button>
            `;

              // Show Update Trial Result button for exams with results
              // Only show if there's a trial exam record or if exam was passed
              if (examResult === "PASS" || hasTrialExam) {
                actions += `
                    <button class="btn btn-sm btn-warning" onclick="updateTrialResultModal(${
                      application.id
                    }, ${
                  hasTrialExam ? application.trialExamData.id : "null"
                })">
                        <i class="fas fa-clipboard-list"></i> Update Trial Result
                    </button>
                `;
              }
            } else {
              // Show the normal Update Result button if no result yet
              actions += `
                <button class="btn btn-sm btn-info" onclick="updateExamResultModal(${application.examData.id})">
                    <i class="fas fa-clipboard-check"></i> Update Result
                </button>
            `;
            }
          } else if (application.status === "APPROVED") {
            actions += `
            <button class="btn btn-sm btn-success" onclick="scheduleExamModal(${application.id})">
                <i class="fas fa-calendar-plus"></i> Schedule Exam
            </button>
        `;
          }

          return actions;
        }

        function getTrialExam(trialExamId) {
          return $.ajax({
            url: `${API_BASE_URL}/trial-exams/${trialExamId}`,
            method: "GET",
            beforeSend: function (xhr) {
              const token = authToken || localStorage.getItem("authToken");
              if (token) {
                xhr.setRequestHeader("Authorization", "Bearer " + token);
              }
            },
          });
        }

        function updateTrialResultModal(applicationId, trialExamId) {
          // Store the application and trial exam IDs
          $("#trialApplicationId").val(applicationId);
          $("#trialExamId").val(trialExamId);

          // If we have a trial exam ID, fetch the current data
          if (trialExamId && trialExamId !== "null") {
            getTrialExam(trialExamId)
              .then((trialData) => {
                $("#trialResult").val(trialData.trialResult || "");
                $("#trialNotes").val(trialData.examinerNotes || "");
              })
              .catch((error) => {
                console.error("Error fetching trial exam data:", error);
              });
          }

          const modal = new bootstrap.Modal(
            document.getElementById("trialResultModal")
          );
          modal.show();
        }

        function saveTrialResult() {
          const applicationId = $("#trialApplicationId").val();
          const trialExamId = $("#trialExamId").val();
          const trialResult = $("#trialResult").val();
          const trialNotes = $("#trialNotes").val();

          if (!trialResult) {
            showAlert("Error", "Please select a trial result", "error");
            return;
          }

          Swal.fire({
            title: "Updating Trial Result...",
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            },
          });

          if (trialExamId && trialExamId !== "null") {
            // Update existing trial exam
            updateTrialExam(trialExamId, trialResult, trialNotes)
              .then((response) => {
                Swal.fire({
                  title: "Success!",
                  text: "Trial result updated successfully",
                  icon: "success",
                }).then(() => {
                  $("#trialResultModal").modal("hide");
                  loadApplications(); // Reload to refresh the UI
                });
              })
              .catch((error) => {
                console.error("Error updating trial result:", error);
                Swal.fire({
                  title: "Error!",
                  text: "Failed to update trial result. Please try again.",
                  icon: "error",
                });
              });
          } else {
            // Create new trial exam record
            createTrialExamRecordFromApplication(
              applicationId,
              trialResult,
              trialNotes
            )
              .then((response) => {
                Swal.fire({
                  title: "Success!",
                  text: "Trial result saved successfully",
                  icon: "success",
                }).then(() => {
                  $("#trialResultModal").modal("hide");
                  loadApplications(); // Reload to refresh the UI
                });
              })
              .catch((error) => {
                console.error("Error creating trial result:", error);
                Swal.fire({
                  title: "Error!",
                  text: "Failed to save trial result. Please try again.",
                  icon: "error",
                });
              });
          }
        }

        function createTrialExamRecordFromApplication(
          applicationId,
          result,
          notes
        ) {
          // First get the written exam data for this application
          return $.ajax({
            url: `${API_BASE_URL}/written-exams/application/${applicationId}`,
            method: "GET",
            beforeSend: function (xhr) {
              const token = authToken || localStorage.getItem("authToken");
              if (token) {
                xhr.setRequestHeader("Authorization", "Bearer " + token);
              }
            },
          }).then((writtenExamData) => {
            const trialExamData = {
              writtenExamId: writtenExamData.id,
              trialDate: new Date().toISOString().split("T")[0], // Current date
              trialTime: "09:00",
              trialLocation: "Colombo DMT",
              trialResult: result,
              examinerNotes: notes,
            };

            return $.ajax({
              url: `${API_BASE_URL}/trial-exams`,
              method: "POST",
              contentType: "application/json",
              data: JSON.stringify(trialExamData),
              beforeSend: function (xhr) {
                const token = authToken || localStorage.getItem("authToken");
                if (token) {
                  xhr.setRequestHeader("Authorization", "Bearer " + token);
                }
              },
            });
          });
        }

        function updateTrialExam(trialExamId, result, notes) {
          const updateData = {
            trialResult: result,
            examinerNotes: notes,
          };

          return $.ajax({
            url: `${API_BASE_URL}/trial-exams/${trialExamId}`,
            method: "PUT",
            contentType: "application/json",
            data: JSON.stringify(updateData),
            beforeSend: function (xhr) {
              const token = authToken || localStorage.getItem("authToken");
              if (token) {
                xhr.setRequestHeader("Authorization", "Bearer " + token);
              }
            },
          });
        }

        // =================== MODAL FUNCTIONS ===================
        function viewApplicationDetails(applicationId) {
          const application = currentApplications.find(
            (app) => app.id === applicationId
          );
          if (!application) return;

          const modalTitle = $("#applicationModalTitle");
          const modalBody = $("#applicationModalBody");

          const fullName = application.driver || application.fullName || "N/A";
          modalTitle.html(
            `<i class="fas fa-file-alt"></i> Application Details - ${fullName}`
          );

          const examInfo = application.examData
            ? `
      <div class="card mb-3">
        <div class="card-header">
          <h5><i class="fas fa-clipboard-check"></i> Exam Information</h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <p><strong>Exam Date:</strong> ${
                application.examData.writtenExamDate || "Not scheduled"
              }</p>
              <p><strong>Exam Time:</strong> ${
                application.examData.writtenExamTime || "Not scheduled"
              }</p>
              <p><strong>Location:</strong> ${
                application.examData.writtenExamLocation || "Not set"
              }</p>
            </div>
            <div class="col-md-6">
              <p><strong>Result:</strong> ${getExamStatusBadge(
                application.examData.writtenExamResult
              )}</p>
              <p><strong>Language:</strong> ${
                application.examData.examLanguage || "Not set"
              }</p>
              ${
                application.examData.note
                  ? `<p><strong>Notes:</strong> ${application.examData.note}</p>`
                  : ""
              }
            </div>
          </div>
        </div>
      </div>
    `
            : '<div class="alert alert-info">No exam scheduled yet</div>';

          modalBody.html(`
      <div class="row">
        <div class="col-12">
          <div class="card mb-3">
            <div class="card-header">
              <h5><i class="fas fa-user"></i> Personal Information</h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <p><strong>Full Name:</strong> ${fullName}</p>
                  <p><strong>NIC:</strong> ${
                    application.nicNumber || application.nic || "N/A"
                  }</p>
                  <p><strong>Date of Birth:</strong> ${formatDate(
                    application.dateOfBirth
                  )}</p>
                  <p><strong>Address:</strong> ${
                    application.address || "N/A"
                  }</p>
                </div>
                <div class="col-md-6">
                  <p><strong>Phone:</strong> ${
                    application.phoneNumber || "N/A"
                  }</p>
                  <p><strong>Email:</strong> ${application.email || "N/A"}</p>
                  <p><strong>Blood Group:</strong> ${
                    application.bloodGroup || "N/A"
                  }</p>
                  <p><strong>Application Date:</strong> ${formatDate(
                    application.submittedDate || application.applicationDate
                  )}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="card mb-3">
            <div class="card-header">
              <h5><i class="fas fa-id-card"></i> License Information</h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <p><strong>License Type:</strong> ${
                    application.licenseType
                  }</p>
                  <p><strong>Vehicle Classes:</strong> ${
                    application.vehicleClasses
                      ? application.vehicleClasses.join(", ")
                      : "N/A"
                  }</p>
                </div>
                <div class="col-md-6">
                  <p><strong>Status:</strong> <span class="status-badge ${getStatusClass(
                    application.status
                  )}">${application.status}</span></p>
                </div>
              </div>
            </div>
          </div>

          ${examInfo}
        </div>
      </div>
    `);

          $("#saveChanges").hide();
          const modal = new bootstrap.Modal(
            document.getElementById("applicationDetailsModal")
          );
          modal.show();
        }

        function updateExamResultModal(examId) {
          $("#examId").val(examId);
          $("#examResult").val("");
          $("#trialDate").val("");
          $("#nextExamDate").val("");
          $("#examNote").val("");
          $("#trialDateContainer").hide();
          $("#nextExamDateContainer").hide();

          const modal = new bootstrap.Modal(
            document.getElementById("examResultModal")
          );
          modal.show();
        }
        
        function saveExamResult() {
          const examId = $("#examId").val();
          const result = $("#examResult").val();
          const note = $("#examNote").val();
          const trialDate = $("#trialDate").val();
          const nextExamDate = $("#nextExamDate").val();

          if (!result) {
            showAlert("Error", "Please select an exam result", "error");
            return;
          }

          if (result === "PASS" && !trialDate) {
            showAlert(
              "Error",
              "Trial date is required for passed results",
              "error"
            );
            return;
          }

          if ((result === "FAIL" || result === "ABSENT") && !nextExamDate) {
            showAlert(
              "Error",
              "Next exam date is required for failed or absent results",
              "error"
            );
            return;
          }

          // Show loading
          Swal.fire({
            title: "Updating Result...",
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            },
          });

          // Use the result-with-dates endpoint which includes PreAuthorize
          updateExamResultWithDates(
            examId,
            result,
            note,
            trialDate,
            nextExamDate
          )
            .then((response) => {
              console.log("Exam result updated successfully");

              // If result is PASS, create trial exam record
              if (result === "PASS" && trialDate) {
                return createTrialExamRecord(examId, trialDate, result, note);
              }
              return Promise.resolve();
            })
            .then((response) => {
              Swal.fire({
                title: "Success!",
                text: "Exam result updated successfully",
                icon: "success",
              }).then(() => {
                $("#examResultModal").modal("hide");
                loadApplications();
              });
            })
            .catch((error) => {
              console.error("Error updating exam result:", error);

              // If the result-with-dates endpoint fails, try the basic result endpoint
              if (error.status === 403 || error.status === 404) {
                console.log("Trying basic result endpoint...");
                updateBasicExamResult(examId, result, note)
                  .then((response) => {
                    // If result is PASS, create trial exam record
                    if (result === "PASS" && trialDate) {
                      return createTrialExamRecord(
                        examId,
                        trialDate,
                        result,
                        note
                      );
                    } else if (
                      (result === "FAIL" || result === "ABSENT") &&
                      nextExamDate
                    ) {
                      return updateNextExamDate(examId, nextExamDate);
                    }
                    return Promise.resolve();
                  })
                  .then((response) => {
                    Swal.fire({
                      title: "Success!",
                      text: "Exam result updated successfully",
                      icon: "success",
                    }).then(() => {
                      $("#examResultModal").modal("hide");
                      loadApplications();
                    });
                  })
                  .catch((secondError) => {
                    handleExamResultError(secondError);
                  });
              } else {
                handleExamResultError(error);
              }
            });
        }

        function updateBasicExamResult(examId, result, note) {
          // Use query parameters instead of request body for the basic endpoint
          let url = `${API_BASE_URL}/written-exams/${examId}/result?result=${encodeURIComponent(
            result
          )}`;

          if (note) {
            url += `&note=${encodeURIComponent(note)}`;
          }

          return $.ajax({
            url: url,
            method: "PATCH",
            beforeSend: function (xhr) {
              const token = authToken || localStorage.getItem("authToken");
              if (token) {
                xhr.setRequestHeader("Authorization", "Bearer " + token);
              }
            },
          });
        }

        function updateExamResultWithDates(
          examId,
          result,
          note,
          trialDate,
          nextExamDate
        ) {
          const data = {
            result: result,
            note: note || "",
            trialDate: result === "PASS" ? trialDate : null,
            nextExamDate:
              result === "FAIL" || result === "ABSENT" ? nextExamDate : null,
          };

          return $.ajax({
            url: `${API_BASE_URL}/written-exams/${examId}/result-with-dates`,
            method: "PATCH",
            contentType: "application/json",
            data: JSON.stringify(data),
            beforeSend: function (xhr) {
              const token = authToken || localStorage.getItem("authToken");
              if (token) {
                xhr.setRequestHeader("Authorization", "Bearer " + token);
              }
            },
          });
        }

        function getWrittenExam(examId) {
          return $.ajax({
            url: `${API_BASE_URL}/written-exams/${examId}`,
            method: "GET",
            beforeSend: function (xhr) {
              const token = authToken || localStorage.getItem("authToken");
              if (token) {
                xhr.setRequestHeader("Authorization", "Bearer " + token);
              }
            },
          });
        }

        function handleExamResultError(error) {
          let errorMessage = "Failed to update exam result. Please try again.";

          if (error.responseJSON && error.responseJSON.message) {
            errorMessage = error.responseJSON.message;
          } else if (error.status === 403) {
            errorMessage =
              "Access denied. You do not have permission to perform this action.";
          } else if (error.status === 404) {
            errorMessage = "Endpoint not found. Please contact administrator.";
          } else if (error.responseText) {
            try {
              const errorObj = JSON.parse(error.responseText);
              errorMessage = errorObj.message || errorMessage;
            } catch (e) {
              errorMessage = error.responseText;
            }
          }

          Swal.fire({
            title: "Error!",
            text: errorMessage,
            icon: "error",
          });
        }

        function updateNextExamDate(examId, nextExamDate) {
          // Try to update using the full exam update endpoint
          return getWrittenExam(examId).then((examData) => {
            const updateData = {
              writtenExamDate: examData.writtenExamDate,
              writtenExamTime: examData.writtenExamTime,
              writtenExamLocation: examData.writtenExamLocation,
              note: examData.note,
              writtenExamResult: examData.writtenExamResult,
              nextExamDate: nextExamDate,
              applicationId: examData.applicationId,
            };

            return $.ajax({
              url: `${API_BASE_URL}/written-exams/${examId}`,
              method: "PUT",
              contentType: "application/json",
              data: JSON.stringify(updateData),
              beforeSend: function (xhr) {
                const token = authToken || localStorage.getItem("authToken");
                if (token) {
                  xhr.setRequestHeader("Authorization", "Bearer " + token);
                }
              },
            });
          });
        }

        function createTrialExamRecord(
          writtenExamId,
          trialDate,
          result,
          notes
        ) {
          const trialExamData = {
            writtenExamId: writtenExamId,
            trialDate: trialDate,
            trialTime: "09:00",
            trialLocation: "Colombo DMT",
            trialResult: "null",
            examinerNotes: notes,
          };

          return $.ajax({
            url: `${API_BASE_URL}/trial-exams`,
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(trialExamData),
            beforeSend: function (xhr) {
              const token = authToken || localStorage.getItem("authToken");
              if (token) {
                xhr.setRequestHeader("Authorization", "Bearer " + token);
              }
            },
          });
        }

        function saveExamSchedule(examId, result, trialDate, nextExamDate) {
          // Prepare exam schedule data
          const examScheduleData = {
            writtenExamId: examId,
            trialDate: result === "PASS" ? trialDate : null,
            nextExamDate:
              result === "FAIL" || result === "ABSENT" ? nextExamDate : null,
          };

          console.log("Saving exam schedule:", examScheduleData);

          // Check if exam schedule already exists
          return $.ajax({
            url: `${API_BASE_URL}/exam-schedules/written-exam/${examId}`,
            method: "GET",
            beforeSend: function (xhr) {
              if (authToken) {
                xhr.setRequestHeader("Authorization", "Bearer " + authToken);
              }
            },
          })
            .then(function (existingSchedule) {
              if (existingSchedule && existingSchedule.id) {
                // Update existing schedule
                examScheduleData.id = existingSchedule.id;
                return $.ajax({
                  url: `${API_BASE_URL}/exam-schedules/${existingSchedule.id}`,
                  method: "PUT",
                  contentType: "application/json",
                  data: JSON.stringify(examScheduleData),
                  beforeSend: function (xhr) {
                    if (authToken) {
                      xhr.setRequestHeader(
                        "Authorization",
                        "Bearer " + authToken
                      );
                    }
                  },
                });
              } else {
                // Create new schedule
                return $.ajax({
                  url: `${API_BASE_URL}/exam-schedules`,
                  method: "POST",
                  contentType: "application/json",
                  data: JSON.stringify(examScheduleData),
                  beforeSend: function (xhr) {
                    if (authToken) {
                      xhr.setRequestHeader(
                        "Authorization",
                        "Bearer " + authToken
                      );
                    }
                  },
                });
              }
            })
            .catch(function (error) {
              console.error(
                "Error checking existing schedule, trying to create new:",
                error
              );
              // If check fails, try to create new schedule
              return $.ajax({
                url: `${API_BASE_URL}/exam-schedules`,
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify(examScheduleData),
                beforeSend: function (xhr) {
                  if (authToken) {
                    xhr.setRequestHeader(
                      "Authorization",
                      "Bearer " + authToken
                    );
                  }
                },
              });
            });
        }

        function scheduleExamModal(applicationId) {
          Swal.fire({
            title: "Schedule Written Exam",
            html: `
        <form id="scheduleExamForm" class="text-start">
          <div class="mb-3">
            <label for="scheduleExamDate" class="form-label">Exam Date</label>
            <input type="date" class="form-control" id="scheduleExamDate" required>
          </div>
          <div class="mb-3">
            <label for="scheduleExamTime" class="form-label">Exam Time</label>
            <input type="time" class="form-control" id="scheduleExamTime" required>
          </div>
          <div class="mb-3">
            <label for="scheduleExamLocation" class="form-label">Exam Location</label>
            <input type="text" class="form-control" id="scheduleExamLocation" 
                   placeholder="e.g., RMV Office - Colombo" required>
          </div>
          <div class="mb-3">
            <label for="scheduleExamLanguage" class="form-label">Exam Language</label>
            <select class="form-control" id="scheduleExamLanguage" required>
              <option value="ENGLISH">English</option>
              <option value="SINHALA">Sinhala</option>
              <option value="TAMIL">Tamil</option>
            </select>
          </div>
        </form>
      `,
            showCancelButton: true,
            confirmButtonText: "Schedule Exam",
            cancelButtonText: "Cancel",
            preConfirm: () => {
              const form = document.getElementById("scheduleExamForm");
              if (!form.checkValidity()) {
                form.reportValidity();
                return false;
              }

              const examDate =
                document.getElementById("scheduleExamDate").value;
              const examTime =
                document.getElementById("scheduleExamTime").value;
              const examLocation = document.getElementById(
                "scheduleExamLocation"
              ).value;
              const examLanguage = document.getElementById(
                "scheduleExamLanguage"
              ).value;

              return { examDate, examTime, examLocation, examLanguage };
            },
          }).then((result) => {
            if (result.isConfirmed && result.value) {
              const { examDate, examTime, examLocation, examLanguage } =
                result.value;

              Swal.fire({
                title: "Scheduling Exam...",
                allowOutsideClick: false,
                didOpen: () => {
                  Swal.showLoading();
                },
              });

              scheduleWrittenExam(
                applicationId,
                examDate,
                examTime,
                examLocation,
                examLanguage
              )
                .then((response) => {
                  Swal.fire({
                    title: "Success!",
                    text: "Written exam scheduled successfully",
                    icon: "success",
                  }).then(() => {
                    loadApplications(); // Reload to get updated data
                  });
                })
                .catch((error) => {
                  console.error("Error scheduling exam:", error);
                  Swal.fire({
                    title: "Error!",
                    text: "Failed to schedule exam. Please try again.",
                    icon: "error",
                  });
                });
            }
          });
        }

        function editApplication(applicationId) {
          const application = currentApplications.find(
            (app) => app.id === applicationId
          );
          if (!application) return;

          Swal.fire({
            title: "Update Application Status",
            html: `
        <form id="updateStatusForm" class="text-start">
          <div class="mb-3">
            <label for="newStatus" class="form-label">Application Status</label>
            <select class="form-control" id="newStatus" required>
              <option value="PENDING" ${
                application.status === "PENDING" ? "selected" : ""
              }>Pending</option>
              <option value="APPROVED" ${
                application.status === "APPROVED" ? "selected" : ""
              }>Approved</option>
              <option value="DECLINED" ${
                application.status === "DECLINED" ? "selected" : ""
              }>Declined</option>
              <option value="COMPLETED" ${
                application.status === "COMPLETED" ? "selected" : ""
              }>Completed</option>
            </select>
          </div>
          <div class="mb-3" id="declineReasonContainer" style="display: none;">
            <label for="declineReason" class="form-label">Decline Reason</label>
            <textarea class="form-control" id="declineReason" rows="3" 
                      placeholder="Please provide reason for declining..."></textarea>
          </div>
        </form>
      `,
            showCancelButton: true,
            confirmButtonText: "Update Status",
            cancelButtonText: "Cancel",
            didOpen: () => {
              // Show/hide decline reason based on status
              document
                .getElementById("newStatus")
                .addEventListener("change", function () {
                  const declineContainer = document.getElementById(
                    "declineReasonContainer"
                  );
                  if (this.value === "DECLINED") {
                    declineContainer.style.display = "block";
                    document.getElementById("declineReason").required = true;
                  } else {
                    declineContainer.style.display = "none";
                    document.getElementById("declineReason").required = false;
                  }
                });

              // Trigger change event to set initial state
              document
                .getElementById("newStatus")
                .dispatchEvent(new Event("change"));
            },
            preConfirm: () => {
              const newStatus = document.getElementById("newStatus").value;
              const declineReason =
                document.getElementById("declineReason").value;

              if (newStatus === "DECLINED" && !declineReason.trim()) {
                Swal.showValidationMessage(
                  "Decline reason is required when declining an application"
                );
                return false;
              }

              return { newStatus, declineReason };
            },
          }).then((result) => {
            if (result.isConfirmed && result.value) {
              const { newStatus, declineReason } = result.value;

              Swal.fire({
                title: "Updating Status...",
                allowOutsideClick: false,
                didOpen: () => {
                  Swal.showLoading();
                },
              });

              updateApplicationStatus(applicationId, newStatus, declineReason)
                .then((response) => {
                  Swal.fire({
                    title: "Success!",
                    text: "Application status updated successfully",
                    icon: "success",
                  }).then(() => {
                    loadApplications(); // Reload to get updated data
                  });
                })
                .catch((error) => {
                  console.error("Error updating status:", error);
                  Swal.fire({
                    title: "Error!",
                    text: "Failed to update application status. Please try again.",
                    icon: "error",
                  });
                });
            }
          });
        }

        function updateApplicationStatus(
          applicationId,
          status,
          declineReason = null
        ) {
          const params = new URLSearchParams({ status });

          const promise = $.ajax({
            url: `${API_BASE_URL}/applications/${applicationId}/status`,
            method: "PUT",
            data: params.toString(),
            contentType: "application/x-www-form-urlencoded",
          });

          // If declining, also create decline record
          if (status === "DECLINED" && declineReason) {
            return promise.then((response) => {
              return $.ajax({
                url: `${API_BASE_URL}/declines/create-decline`,
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify({
                  applicationId: applicationId,
                  declineReason: declineReason,
                  declineNotes: declineReason,
                  declinedBy: currentUserName || "Admin",
                }),
              });
            });
          }

          return promise;
        }

        // =================== UTILITY FUNCTIONS ===================
        function debounce(func, wait) {
          let timeout;
          return function executedFunction(...args) {
            const later = () => {
              clearTimeout(timeout);
              func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
          };
        }

        function formatDate(dateString) {
          if (!dateString) return "N/A";
          const date = new Date(dateString);
          return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });
        }

        function showAlert(title, text, icon) {
          Swal.fire({
            title: title,
            text: text,
            icon: icon,
            confirmButtonText: "OK",
          });
        }

        // =================== FILTERING AND SORTING ===================
        function applyFilters() {
          const searchTerm = $("#searchDriver").val().toLowerCase();
          const licenseType = $("#filterLicenseType").val();
          const status = $("#filterStatus").val();
          const examStatus = $("#filterExam").val();

          let filtered = currentApplications;

          if (searchTerm) {
            filtered = filtered.filter((app) => {
              const fullName = (app.driver || app.fullName || "").toLowerCase();
              const nicNumber = (app.nicNumber || app.nic || "").toLowerCase();
              const appId = app.id.toString();

              return (
                fullName.includes(searchTerm) ||
                nicNumber.includes(searchTerm) ||
                appId.includes(searchTerm)
              );
            });
          }

          if (licenseType) {
            filtered = filtered.filter(
              (app) =>
                app.vehicleClasses && app.vehicleClasses.includes(licenseType)
            );
          }

          if (status) {
            filtered = filtered.filter((app) => app.status === status);
          }

          if (examStatus) {
            filtered = filtered.filter((app) => {
              const appExamStatus = app.examData
                ? app.examData.writtenExamResult
                : "PENDING";
              return appExamStatus === examStatus;
            });
          }

          currentPage = 1;
          renderApplicationsList(filtered);
        }

        function sortApplications() {
          const sortBy = $("#sortBy").val();
          let sorted = [...filteredApplications];

          switch (sortBy) {
            case "name_asc":
              sorted.sort((a, b) => {
                const nameA = a.driver || a.fullName || "";
                const nameB = b.driver || b.fullName || "";
                return nameA.localeCompare(nameB);
              });
              break;
            case "name_desc":
              sorted.sort((a, b) => {
                const nameA = a.driver || a.fullName || "";
                const nameB = b.driver || b.fullName || "";
                return nameB.localeCompare(nameA);
              });
              break;
            case "date_asc":
              sorted.sort((a, b) => {
                const dateA = new Date(
                  a.submittedDate || a.applicationDate || 0
                );
                const dateB = new Date(
                  b.submittedDate || b.applicationDate || 0
                );
                return dateA - dateB;
              });
              break;
            case "date_desc":
              sorted.sort((a, b) => {
                const dateA = new Date(
                  a.submittedDate || a.applicationDate || 0
                );
                const dateB = new Date(
                  b.submittedDate || b.applicationDate || 0
                );
                return dateB - dateA;
              });
              break;
            case "status_asc":
              sorted.sort((a, b) => a.status.localeCompare(b.status));
              break;
          }

          renderApplicationsList(sorted);
        }

        function updateStats() {
          if (!filteredApplications.length) {
            $("#totalApplications").text(0);
            $("#pendingApplications").text(0);
            $("#approvedApplications").text(0);
            $("#declinedApplications").text(0);
            return;
          }

          $("#totalApplications").text(filteredApplications.length);

          const pendingCount = filteredApplications.filter(
            (app) => app.status === "PENDING"
          ).length;
          $("#pendingApplications").text(pendingCount);

          const approvedCount = filteredApplications.filter(
            (app) => app.status === "APPROVED"
          ).length;
          $("#approvedApplications").text(approvedCount);

          const declinedCount = filteredApplications.filter(
            (app) => app.status === "DECLINED"
          ).length;
          $("#declinedApplications").text(declinedCount);
        }

        // =================== PAGINATION ===================
        function renderPagination(totalPages) {
          const pagination = $("#pagination");
          pagination.empty();

          if (totalPages <= 1) return;

          pagination.append(`
      <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
        <a class="page-link" href="#" onclick="changePage(${
          currentPage - 1
        }); return false;">
          <i class="fas fa-chevron-left"></i>
        </a>
      </li>
    `);

          // Show page numbers with ellipsis for large page counts
          const maxVisiblePages = 5;
          let startPage = Math.max(
            1,
            currentPage - Math.floor(maxVisiblePages / 2)
          );
          let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

          if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
          }

          if (startPage > 1) {
            pagination.append(`
        <li class="page-item">
          <a class="page-link" href="#" onclick="changePage(1); return false;">1</a>
        </li>
      `);
            if (startPage > 2) {
              pagination.append(
                '<li class="page-item disabled"><span class="page-link">...</span></li>'
              );
            }
          }

          for (let i = startPage; i <= endPage; i++) {
            pagination.append(`
        <li class="page-item ${i === currentPage ? "active" : ""}">
          <a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>
        </li>
      `);
          }

          if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
              pagination.append(
                '<li class="page-item disabled"><span class="page-link">...</span></li>'
              );
            }
            pagination.append(`
        <li class="page-item">
          <a class="page-link" href="#" onclick="changePage(${totalPages}); return false;">${totalPages}</a>
        </li>
      `);
          }

          pagination.append(`
      <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
        <a class="page-link" href="#" onclick="changePage(${
          currentPage + 1
        }); return false;">
          <i class="fas fa-chevron-right"></i>
        </a>
      </li>
    `);
        }

        // Make functions globally accessible
        window.changePage = function (page) {
          if (
            page < 1 ||
            page > Math.ceil(filteredApplications.length / applicationsPerPage)
          )
            return;
          currentPage = page;
          renderApplicationsList(filteredApplications);
          window.scrollTo({ top: 0, behavior: "smooth" });
        };

      });