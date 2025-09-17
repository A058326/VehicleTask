// בעת שליחת הטופס מתבצע חיפוש
$('#searchForm').on('submit', function(e) {
	e.preventDefault(); // מניעת רענון דף
	var license = $('#licenseInput').val().trim();
	if (!license) return;

	// הצגת אנימציית טעינה
	$('#results').html('<div class="text-center"><div class="spinner-border" role="status"></div></div>');

	// קריאה ל־API של data.gov.il
		$.ajax({
			url: 'https://data.gov.il/api/3/action/datastore_search',
			data: {
				resource_id: '053cea08-09bc-40ec-8f7a-156f0677aff3', // מזהה מאגר כלי רכב
				q: license, // מספר רישוי לחיפוש
				limit: 5 // עד 5 תוצאות
			},
			dataType: 'json', // ניסיון לשלוח כ־JSON רגיל
			success: function(data) {
				var cars = data.result.records;
				if (cars.length === 0) {
					$('#results').html('<div class="alert alert-warning">לא נמצאו תוצאות</div>');
					return;
				}
				// יצירת כרטיסי Bootstrap לכל רכב
				var html = '';
				$.each(cars, function(i, car) {
					html += `
						<div class="col-md-4">
							<div class="card shadow animate__animated animate__fadeIn">
								<div class="card-body">
									<h5 class="card-title">מספר רישוי: ${car.mispar_rechev}</h5>
									<p class="card-text">יצרן: ${car.tozeret_nm || 'לא ידוע'}<br>
									דגם: ${car.kinuy_mishari || 'לא ידוע'}<br>
									שנה: ${car.shnat_yitzur || 'לא ידוע'}<br>
									צבע: ${car.tzeva_rechev || 'לא ידוע'}</p>
								</div>
							</div>
						</div>
					`;
				});
				$('#results').html(html);
			},
			error: function(xhr, status, error) {
				// טיפול בשגיאת CORS
				if (xhr.status === 0) {
					$('#results').html('<div class="alert alert-danger">ייתכן שיש מגבלת אבטחה בדפדפן (CORS). נסה מדפדפן אחר או דרך שרת Proxy.</div>');
				} else {
					$('#results').html('<div class="alert alert-danger">שגיאה בשליפת נתונים: ' + error + '</div>');
				}
			}
		});
});

// דוגמה לפונקציית jQuery נוספת: מעבר צבע רקע לכרטיסים בלחיצה
$(document).on('click', '.card', function() {
	$(this).toggleClass('bg-info'); // מעבר צבע רקע
});

// דוגמה לאנימציה נוספת עם jQuery: מעבר חלק לראש הדף בלחיצה על ה־Navbar
$('.navbar-brand').on('click', function() {
	$('html, body').animate({ scrollTop: 0 }, 600);
});
