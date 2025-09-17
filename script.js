// בעת שליחת הטופס מתבצע חיפוש
$('#searchForm').on('submit', function(e) {
    e.preventDefault();
    var license = $('#licenseInput').val().trim();
    var model = $('#modelInput').val().trim();
    var color = $('#colorInput').val().trim();
    var year = $('#yearInput').val().trim();
    var maker = $('#makerInput').val().trim();
    var sortBy = $('#sortSelect').val();

    // הצגת אנימציית טעינה
    $('#results').html('<div class="text-center"><div class="spinner-border" role="status"></div></div>');

    // בניית שאילתא לחיפוש
    let queryArr = [];
    if (license) queryArr.push(license);
    if (model) queryArr.push(model);
    if (color) queryArr.push(color);
    if (year) queryArr.push(year);
    if (maker) queryArr.push(maker);
    let query = queryArr.join(' ');

    $.ajax({
        url: 'https://data.gov.il/api/3/action/datastore_search',
        data: {
            resource_id: '053cea08-09bc-40ec-8f7a-156f0677aff3',
            q: query,
            limit: 50
        },
        dataType: 'json',
        success: function(data) {
            var cars = data.result.records;

            // סינון נוסף בצד לקוח
            if (model) {
                cars = cars.filter(car => car.kinuy_mishari && car.kinuy_mishari.includes(model));
            }
            if (color) {
                cars = cars.filter(car => car.tzeva_rechev && car.tzeva_rechev.includes(color));
            }
            if (year) {
                cars = cars.filter(car => car.shnat_yitzur && car.shnat_yitzur.toString().includes(year));
            }
            if (maker) {
                cars = cars.filter(car => car.tozeret_nm && car.tozeret_nm.includes(maker));
            }

            // מיון תוצאות
            if (sortBy === 'model') {
                cars.sort((a, b) => (a.kinuy_mishari || '').localeCompare(b.kinuy_mishari || ''));
            } else if (sortBy === 'year') {
                cars.sort((a, b) => (b.shnat_yitzur || 0) - (a.shnat_yitzur || 0));
            } else if (sortBy === 'license') {
                cars.sort((a, b) => (a.mispar_rechev || '').localeCompare(b.mispar_rechev || ''));
            }

            if (cars.length === 0) {
                $('#results').html('<div class="alert alert-warning">לא נמצאו תוצאות מתאימות</div>');
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
            if (xhr.status === 0) {
                $('#results').html('<div class="alert alert-danger">ייתכן שיש מגבלת אבטחה בדפדפן (CORS). נסה מדפדפן אחר או דרך שרת Proxy.</div>');
            } else {
                $('#results').html('<div class="alert alert-danger">שגיאה בשליפת נתונים: ' + error + '</div>');
            }
        }
    });
});

// ניקוי כל השדות וכיבוי תוצאות
$('#clearBtn').on('click', function() {
    $('#licenseInput').val('');
    $('#modelInput').val('');
    $('#colorInput').val('');
    $('#yearInput').val('');
    $('#makerInput').val('');
    $('#sortSelect').val('');
    $('#results').html('');
});

// דוגמה לפונקציית jQuery נוספת: מעבר צבע רקע לכרטיסים בלחיצה
$(document).on('click', '.card', function() {
    $(this).toggleClass('bg-info'); // מעבר צבע רקע
});

// דוגמה לאנימציה נוספת עם jQuery: מעבר חלק לראש הדף בלחיצה על ה־Navbar
$('.navbar-brand').on('click', function() {
    $('html, body').animate({ scrollTop: 0 }, 600);
});