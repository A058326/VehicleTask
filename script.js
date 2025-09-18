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
  // בדיקת מספר רישוי (7-8 ספרות)
  if (license) {
    if (/^\d{7,8}$/.test(license)) {
      valid = true;
    } else {
      errorMsg = "מספר רישוי חייב להיות 7 או 8 ספרות.";
    }
  }
  // בדיקת דגם/צבע/יצרן (לפחות 2 תווים)
  if (model && model.length >= 2) valid = true;
  else if (model && model.length < 2)
    errorMsg = "דגם חייב להיות לפחות 2 תווים.";
  if (color && color.length >= 2) valid = true;
  else if (color && color.length < 2)
    errorMsg = "צבע חייב להיות לפחות 2 תווים.";
  if (maker && maker.length >= 2) valid = true;
  else if (maker && maker.length < 2)
    errorMsg = "יצרן חייב להיות לפחות 2 תווים.";
  // בדיקת שנה (4 ספרות)
  if (year) {
    if (/^\d{4}$/.test(year)) valid = true;
    else errorMsg = "שנה חייבת להיות 4 ספרות.";
  }
  // אם אף שדה לא תקין
  if (!valid) {
    $("#results").html(
      '<div class="alert alert-warning">' +
        (errorMsg || "יש למלא לפחות שדה חיפוש אחד בצורה תקינה!") +
        "</div>"
    );
    return;
  }

  // הצגת אנימציית טעינה
  $("#results").html(
    '<div class="text-center"><div class="spinner-border" role="status"></div></div>'
  );

  // בניית שאילתא לחיפוש
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

      // סינון נוסף בצד לקוח
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

      // מיון תוצאות
      if (sortBy === "model") {
        // מיון אלפביתי לפי יצרן רק אם יש יותר מיצרן אחד
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
        // מיון לפי שנה רק אם יש חיפוש לפי שנה
        if (year) {
          cars.sort((a, b) => (b.shnat_yitzur || 0) - (a.shnat_yitzur || 0));
        } else {
          $("#results").html(
            '<div class="alert alert-warning">מיון לפי שנה אפשרי רק כאשר יש חיפוש לפי שנה.</div>'
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
        // מיון לפי צבע רק אם יש חיפוש לפי צבע
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

      // יצירת כרטיסי Bootstrap לכל רכב
      var html = "";
      $.each(cars, function (i, car) {
        html += `
                    <div class="col-md-4">
                        <div class="card shadow animate__animated animate__fadeIn">
                            <div class="card-body">
                                <h5 class="card-title">מספר רישוי: ${
                                  car.mispar_rechev
                                }</h5>
                                <p class="card-text">יצרן: ${
                                  car.tozeret_nm || "לא ידוע"
                                }<br>
                                דגם: ${car.kinuy_mishari || "לא ידוע"}<br>
                                שנה: ${car.shnat_yitzur || "לא ידוע"}<br>
                                צבע: ${car.tzeva_rechev || "לא ידוע"}</p>
                            </div>
                        </div>
                    </div>
                `;
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

// ניקוי שדות החיפוש בלבד
$("#clearFieldsBtn").on("click", function () {
  $("#licenseInput").val("");
  $("#modelInput").val("");
  $("#colorInput").val("");
  $("#yearInput").val("");
  $("#makerInput").val("");
  $("#sortSelect").val("");
});

// ניקוי תוצאות בלבד
$("#clearResultsBtn").on("click", function () {
  $("#results").html("");
});

// מעבר צבע רקע לכרטיסים רק בלחיצה על הכרטיס עצמו (ולא על שדות/כפתורים)
$(document).on("click", ".card", function (e) {
  // אם נלחץ אלמנט שהוא input, select, button או בתוכם - לא להחליף צבע
  if (
    $(e.target).is("input, select, button, textarea") ||
    $(e.target).closest("input, select, button, textarea").length
  ) {
    return;
  }
  $(this).toggleClass("clicked");
});

// דוגמה לאנימציה נוספת עם jQuery: מעבר חלק לראש הדף בלחיצה על ה־Navbar
$(".navbar-brand").on("click", function () {
  $("html, body").animate({ scrollTop: 0 }, 600);
});

// רקע מתחלף
const bgImages = [
  "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1500&q=80", // 1
  "https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=1500&q=80", // 2
  "https://images.unsplash.com/photo-1485291571150-772bcfc10da5?auto=format&fit=crop&w=1500&q=80", // 3
  "https://images.unsplash.com/photo-1531850959096-cfbb6f26c5a8?auto=format&fit=crop&w=1500&q=80", // 4
];
let bgIndex = 0;
const bgDiv = document.getElementById("background-slideshow");

// הגדרת תמונה ראשונה
bgDiv.style.backgroundImage = `url('${bgImages[bgIndex]}')`;
bgDiv.style.opacity = 1;

function fadeToNextBg() {
  bgDiv.style.transition = "opacity 2s";
  bgDiv.style.opacity = 0;
  setTimeout(() => {
    bgIndex = (bgIndex + 1) % bgImages.length;
    bgDiv.style.backgroundImage = `url('${bgImages[bgIndex]}')`;
    bgDiv.style.opacity = 1;
  }, 2000);
}

// מעבר כל 10 שניות (כולל 2 שניות מעבר)
setInterval(fadeToNextBg, 20000);

$("#infoBtn").on("click", function () {
  $("#infoBox").addClass("show");
});
$("#closeInfo").on("click", function () {
  $("#infoBox").removeClass("show");
});

$("#aboutBtn").on("click", function () {
  $("#aboutBox").addClass("show");
});
$("#closeAbout").on("click", function () {
  $("#aboutBox").removeClass("show");
});
