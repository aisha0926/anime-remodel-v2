// const height = $(".cards-col-lg").height();
const height = $(".cards").height();
const width = $(".cards").width();
const calc = height / 2;

$('.card-rank').css({ height: calc });
$('.card-rank p').css({ lineHeight: height + "px" });
$('.cards-content').css({ height: height });
$('.card-img-resize').css({ height: height, width: width / 2 });

$('.nav-item a').on('click', function () {
    $('.nav-item a').removeClass('active');
    $(this).addClass('active');
    $('#mySpinner').show();
    $('.cards-row-modified').hide();

    if ($(`[data-navtab="anime"]`)) {
        $('#side-bar').hide();
    } else {
        $('#side-bar').show();
    }

    if ($(`[data-navtab="genre"]`)) {
        $('.content-bottom-border').hide();
    }
});

/*
We're selecting the URL, based on the url and the check if the url path is the same
as the data-navtab name.
*/
function NavTabActive() {
    //Pathname = Anything after the base URL. Splitting the text based on "/"
    let url = window.location.pathname.split("/");
    //Taking the first url name
    let navTabName = url[1].toLowerCase();
    console.log(navTabName);

    //if this class is not empty
    if (navTabName != "") {
        $('.nav-link').removeClass("active");
        //We're selecting the exact tab and add the attribute (e.g. give class)
        $(`[data-navtab="${navTabName}"]`).addClass("active");
    }
    else {
        $('.nav-link').removeClass("active");
        $(`[data-navtab="home"]`).addClass("active");
    }
}

NavTabActive();

// Modal


$('.block-section').click(function () {
    let score = $(this).attr('data-score');
    let genres = $(this).attr('data-genre');
    let image = $(this).attr('data-imgUrl');
    let title = $(this).attr('data-title');
    let isTableBlock = $('.block-section').hasClass('second-section');
    let apiType = $(this).attr('data-type');
    $('#score').text(score);
    $('#posterImage').attr('src', image);
    $('#genres').text(genres);
    $('#animeModalTitle').text(title);

    $('#animeModel').modal("show");
    // this url of api
    let apiUrl = `https://api.jikan.moe/v3/search/anime?q=${title}`;
    console.log(apiType)
    if (isTableBlock && apiType === "TV") {
        apiUrl = `https://api.jikan.moe/v3/top/anime/1/tv?q=${title}`;
    }
    if (isTableBlock && apiType === 'Manhwa') {
        apiUrl = `https://api.jikan.moe/v3/top/manga/1/manhwa?q=${title}`;
    }
    // this piece of code only run when request is pending
    $(document).ajaxStart(function () {
        const spinnerHTML = `
        <div class="d-flex justify-content-center">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
        `;
        $("#animeModalTitle").html(spinnerHTML);
        $("#Synopsis").html('');
        $("#episodes").html('');
        $("#score").html('');
    });


    $.ajax({
        url: apiUrl,
        success: function (data) {
            if (!data) {
                return;
            }
            console.log(data);
            let exactData = {}
            if (isTableBlock && apiType === 'TV') {
                exactData = data.top.find(item => item.title === title);
                $('#Synopsis').html(`
                    <strong class="modal-body-content">Start Date:</strong>
                    <span>${exactData.start_date}</span>
                `);
                $('#episodes').html(`<strong class="modal-body-content">Episodes:</strong><span>${exactData.episodes}</span>`);
            } else if (isTableBlock && apiType === 'Manhwa') {
                exactData = data.top.find(item => item.title === title);
                $('#Synopsis').html(`
                    <strong class="modal-body-content">Start Date:</strong>
                    <span>${exactData.start_date}</span>
                `);
                $('#episodes').html(`<strong class="modal-body-content">Rank:</strong><span>${exactData.rank}</span>`);
            } else {
                exactData = data.results.find(item => item.title === title);
                $('#Synopsis').html(`<strong class="modal-body-content">Synopsis:</strong><br><p style="text-indent: 5em;">${exactData.synopsis}</p>`);
                $('#episodes').html(`<strong class="modal-body-content">Episodes:</strong><span>${exactData.episodes}</span>`);
            }
            // $('#cardTitle').text(exactData.title);
            $("#animeModalTitle").text(exactData.title);
            $('#score').html(`<strong class="modal-body-content">Score:</strong><span>${exactData.score}</span>`)
        },
        dataType: 'json'
    });

    $('#addToList').popover().click(function () {
        setTimeout(function () {
            $('#addToList').popover('hide');
        }, 1000);
    });

    let url = window.location.pathname;
    $('#animeName').val(title)
    $('#urlPath').val(url)
})

// $('.block-section').click(function () {
//     let test = $(this).attr('data-title');
//     $('#myForm input:text').val(test);
//     var hm = $('#myForm input:text').val(test);
//     console.log(hm);
//     $('#myForm').submit();
//     $('#animeModel').modal("show");
// })