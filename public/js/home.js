const getWindowWidth = $(window).width();
const containerBody = $('.content-padding').width();
const calcContainerCol2 = $('.content-padding').width() / 2.1;
const calcContainerCol3 = $('.content-padding').width() / 3;
const sideBarCalc = calcContainerCol3 / 2;
const getParentTable = $('#top-anime').height();
const genreDataContent = $('.data-content').width();

const getSpinnerWidth = $('#mySpinner').width();
const getSpinnerHeigth = $('#mySpinner').width();

var getCardContentBody = $('.content').width();

// $('#top-manhwa').css({ height: getParentTable });
if (getWindowWidth < 576) {
    $('.tr-content').css({ width: genreDataContent / 2.5 });
} else if (getWindowWidth < 768) {
    $('#top-anime, #top-manhwa').css({ width: containerBody })
    $('.tr-content').css({ width: genreDataContent / 4 });
} else if (getWindowWidth < 1200) {
    $('#top-anime, #top-manhwa').css({ width: calcContainerCol2 })
    $('.tr-content').css({ width: genreDataContent / 5 });
    console.log(genreDataContent / 5);
    $('#iframe-tube').css({ height: getSpinnerHeigth / 3, width: getSpinnerWidth / 3 });
    $('.box p').css({ fontSize: getCardContentBody / 10 });
    $('.box h4').css({ fontSize: getCardContentBody / 8 });
} else if (getWindowWidth > 1200) {
    $('#side-bar').css({ width: sideBarCalc })
    $('.tr-content').css({ width: genreDataContent / 6 });
    $('#iframe-tube').css({ height: getSpinnerHeigth / 4, width: getSpinnerWidth / 4 });
    $('.box h4').css({ fontSize: getCardContentBody / 8 });
} else {
    $('#top-anime, #top-manhwa').css({ width: calcContainerCol3 })
}