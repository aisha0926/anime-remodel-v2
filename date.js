
module.exports = getDate;

function getDate() {
    const date = new Date();
    const getMonth = date.getMonth();
    var getSeason = '';

    if (getMonth >= 2 && getMonth <= 4) {
        getSeason = 'spring';
    } else if (getMonth >= 5 && getMonth <= 7) {
        getSeason = 'summer';
    } else if (getMonth >= 8 && getMonth <= 10) {
        getSeason = 'autumn'
    } else {
        getSeason = 'winter';
    }
    return getSeason;
}