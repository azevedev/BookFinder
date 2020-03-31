var apiKey;
var list;
$(document).ready(function(){
    apiKey = "AIzaSyCnH0CugPJAFwEvJzoMAebMlTkf5Y69Hq0";
    list = $("#list");
});

$("#srcBtn").on( "click", function() {
    var input = $("#srcIn").val();
    list[0].innerHTML = '';
    if(input != ""){
        var url = "https://www.googleapis.com/books/v1/volumes?q="+input+"&key="+apiKey;
        $.get(url, function(data, status){
            if(status == "success"){
                if(data.totalItems > 0){
                    data.items.forEach(lockToDiv);
                }else{
                    noResults();
                }
            }
        });
    }
});


function lockToDiv(item){
    var title = item.volumeInfo.title;
    var subtitle = item.volumeInfo.subtitle;
    var authors = item.volumeInfo.authors;
    var thumbnail = item.volumeInfo.imageLinks.thumbnail;
    var link = item.volumeInfo.canonicalVolumeLink;
    var publisher = item.volumeInfo.publisher;
    const d = new Date(item.volumeInfo.publishedDate);
    const ye = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(d);
    const mo = new Intl.DateTimeFormat('en', { month: '2-digit' }).format(d);
    const da = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(d);
    var date = da+"/"+mo+"/"+ye;
    var categories = item.volumeInfo.categories;
    var divBook = document.createElement("div");
    var divImg = document.createElement("div");
    var divText = document.createElement("div");
    divImg.innerHTML = `<img src="`+thumbnail+`" alt="Thumbnail"></img>`;
    divText.innerHTML = `<p>Title: `+title+`<br>
    <small>`+subtitle+`</small></p><br>
    <p>Authors: `+authors+`</p><br>
    <p>publisher: `+publisher+` <small>(`+date+`)</small></p><br>
    <p>Categories: `+categories+`</p><br>
    <p><a target="_blank" href="`+link+`">Read more >></a></p>`;
    divBook.classList.add("book");
    divImg.classList.add("img");
    divText.classList.add("text");
    divBook.append(divImg);
    divBook.append(divText);
    list.append(divBook);
}

function noResults(){
    alert("No results found...");
}