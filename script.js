$(document).ready(function () {
  // הפעלת חיפוש אוטומטית כאשר משתנה ערך המיון
  $("#sortSelect").on("change", function () {
    $("#searchForm").submit();
  });

  // בעת שליחת הטופס מתבצע חיפוש
  $("#searchForm").on("submit", function (e) {
    e.preventDefault();
    var license = $("#licenseInput").val().trim();
    var model = $("#modelInput").val().trim();
    var color = $("#colorInput").val().trim();
    var year = $("#yearInput").val().trim();
    var maker = $("#makerInput").val().trim();
    var sortBy = $("#sortSelect").val();

    // ולידציה לשדות החיפוש
    let valid = false;
    let errorMsg = "";
    if (license) {
      if (/^\d{7,8}$/.test(license)) {
        valid = true;
      } else {
        errorMsg = "מספר רישוי חייב להיות 7 או 8 ספרות.";
      }
    }
    if (model && model.length >= 2) valid = true;
    else if (model && model.length < 2)
      errorMsg = "דגם חייב להיות לפחות 2 תווים.";
    if (color && color.length >= 2) valid = true;
    else if (color && color.length < 2)
      errorMsg = "צבע חייב להיות לפחות 2 תווים.";
    if (maker && maker.length >= 2) valid = true;
    else if (maker && maker.length < 2)
      errorMsg = "יצרן חייב להיות לפחות 2 תווים.";
    if (year) {
      if (/^\d{4}$/.test(year)) valid = true;
      else errorMsg = "שנה חייבת להיות 4 ספרות.";
    }

    if (!valid) {
      $("#results").html(
        '<div class="alert alert-warning">' +
          (errorMsg || "יש למלא לפחות שדה חיפוש אחד בצורה תקינה!") +
          "</div>"
      );
      return;
    }

    // אנימציית טעינה
    $("#results").html(
      '<div class="text-center"><div class="spinner-border" role="status"></div></div>'
    );

    // בניית שאילתא
    let queryArr = [];
    if (license) queryArr.push(license);
    if (model) queryArr.push(model);
    if (color) queryArr.push(color);
    if (year) queryArr.push(year);
    if (maker) queryArr.push(maker);
    let query = queryArr.join(" ");

    $.ajax({
      url: "https://data.gov.il/api/3/action/datastore_search",
      data: {
        resource_id: "053cea08-09bc-40ec-8f7a-156f0677aff3",
        q: query,
        limit: 50,
      },
      dataType: "json",
      success: function (data) {
        var cars = data.result.records;

        // סינון צד לקוח
        if (model) {
          cars = cars.filter(
            (car) => car.kinuy_mishari && car.kinuy_mishari.includes(model)
          );
        }
        if (color) {
          cars = cars.filter(
            (car) => car.tzeva_rechev && car.tzeva_rechev.includes(color)
          );
        }
        if (year) {
          cars = cars.filter(
            (car) =>
              car.shnat_yitzur && car.shnat_yitzur.toString().includes(year)
          );
        }
        if (maker) {
          cars = cars.filter(
            (car) => car.tozeret_nm && car.tozeret_nm.includes(maker)
          );
        }

        // מיון
        if (sortBy === "model") {
          const makers = [
            ...new Set(cars.map((car) => car.tozeret_nm).filter(Boolean)),
          ];
          if (makers.length > 1) {
            cars.sort((a, b) =>
              (a.tozeret_nm || "").localeCompare(b.tozeret_nm || "")
            );
          } else {
            $("#results").html(
              '<div class="alert alert-warning">מיון לפי יצרן אפשרי רק כאשר יש יותר מיצרן אחד בתוצאות.</div>'
            );
            return;
          }
        } else if (sortBy === "year") {
          // שינוי: מיון לפי שנה רק אם חיפשו לפי יצרן / צבע / דגם
          if (maker || model || color) {
            cars.sort((a, b) => (b.shnat_yitzur || 0) - (a.shnat_yitzur || 0));
          } else {
            $("#results").html(
              '<div class="alert alert-warning">מיון לפי שנה אפשרי רק כאשר החיפוש כולל יצרן, דגם או צבע.</div>'
            );
            return;
          }
        } else if (sortBy === "license") {
          cars.sort((a, b) => {
            const numA = parseInt(a.mispar_rechev, 10) || 0;
            const numB = parseInt(b.mispar_rechev, 10) || 0;
            return numA - numB;
          });
        } else if (sortBy === "color") {
          if (color) {
            cars.sort((a, b) =>
              (a.tzeva_rechev || "").localeCompare(b.tzeva_rechev || "")
            );
          } else {
            $("#results").html(
              '<div class="alert alert-warning">מיון לפי צבע אפשרי רק כאשר יש חיפוש לפי צבע.</div>'
            );
            return;
          }
        }

        if (cars.length === 0) {
          $("#results").html(
            '<div class="alert alert-warning">לא נמצאו תוצאות מתאימות</div>'
          );
          return;
        }

        // כרטיסי Bootstrap
        var html = "";
        $.each(cars, function (i, car) {
          html += `
            <div class="col-md-4">
              <div class="card shadow animate__animated animate__fadeIn">
                <div class="card-body">
                  <h5 class="card-title">מספר רישוי: ${car.mispar_rechev}</h5>
                  <p class="card-text">
                    יצרן: ${car.tozeret_nm || "לא ידוע"}<br>
                    דגם: ${car.kinuy_mishari || "לא ידוע"}<br>
                    שנה: ${car.shnat_yitzur || "לא ידוע"}<br>
                    צבע: ${car.tzeva_rechev || "לא ידוע"}
                  </p>
                </div>
              </div>
            </div>`;
        });
        $("#results").html(html);
      },
      error: function (xhr, status, error) {
        if (xhr.status === 0) {
          $("#results").html(
            '<div class="alert alert-danger">ייתכן שיש מגבלת אבטחה בדפדפן (CORS). נסה מדפדפן אחר או דרך שרת Proxy.</div>'
          );
        } else {
          $("#results").html(
            '<div class="alert alert-danger">שגיאה בשליפת נתונים: ' +
              error +
              "</div>"
          );
        }
      },
    });
  });

  // ניקוי שדות
  $("#clearFieldsBtn").on("click", function () {
    $("#licenseInput").val("");
    $("#modelInput").val("");
    $("#colorInput").val("");
    $("#yearInput").val("");
    $("#makerInput").val("");
    $("#sortSelect").val("");
  });

  // ניקוי תוצאות
  $("#clearResultsBtn").on("click", function () {
    $("#results").html("");
  });

  // קישור דינמי בין כפתור לתיבה
  $(".header button[data-target]").on("click", function () {
    var target = $(this).data("target");
    $(target).addClass("active");
  });
  $(".close-info, .close-about").on("click", function () {
    $(this).closest(".info-box, .about-box").removeClass("active");
  });
});
