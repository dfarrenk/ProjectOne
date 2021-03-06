/*global firebase $*/
// TODO only for testing, we have to replace this variables by userID after we will get authentication done
var userID = 1;
var userName = null;
var partnerID = false;
var groupId = window.sessionStorage.getItem('currentGroupId');
var userItemsInDB = 0;
var partnerItemsInDB = false;

var db = firebase.database();

function addNewIdeaChip(ideaName) {
    console.log("Your's idea: "+ideaName);
    var newIdea = $("<div>").addClass("chip close");
    var close = $("<i>").addClass("material-icons close");
    newIdea.attr("data-name", ideaName);
    newIdea.text(ideaName);
    close.text("close");
    newIdea.append(close);
    $("#yourGiftIdeas").append(newIdea);
}

function displayPartnerIdeaChip(ideaName){
    console.log("Partner's idea: "+ideaName);
    var newIdea = $("<div class='chip'>").text(ideaName);
    $("#partnerGiftIdeas").append(newIdea);
}

function displayGroupMembers (groupId) {
    db.ref("groups/" + groupId + "/followers").on("child_added", function(snapshot1) {
        console.log("Followers:" + snapshot1.val());
        console.log("TEST: " + snapshot1.val());
        db.ref("users/")
        .orderByChild("uniqueId")
        .equalTo(snapshot1.val())
        .on("child_added", function(snapshot) {
            $("#member-list").append($("<li class='collection-item'>").text(snapshot.val().Name));
        });
    });
}

function writeNewChatMessage(message) {
    var postData = {
        name: userName,
        message: message,
        time: moment().format('LT'),
        date: moment().format('L')
    };
    //1 push info to the database
    db.ref("/groups/" + groupId + "/chat/").push(postData);
    $("#message").val("");
    return 1;
}

$(document).ready(function() {

    //Adding user's personal preference
    userID = sessionStorage.getItem('userid');
    console.log("userID: "+userID);
    userItemsInDB = db.ref("/groups/" + groupId + "/giftideas/" + userID);

    //chat
    $("#sendToChat").click(()=>{
        writeNewChatMessage($("#message").val());
    })

    db.ref("/groups/" + groupId + "/chat").on("child_added", (snap)=>{
        $("#chat").prepend(snap.val().time +" "+ snap.val().name + ": " + snap.val().message + "&#13;");
    })

    //get partner's id
    db.ref("/groups/" + groupId + "/FollowersTest/" + userID)
    .once("value",function(snapshot){
        partnerID = snapshot.val();
        console.log("PartnerID: "+partnerID);
        //display partner name and items
        partnerItemsInDB =  db.ref("/groups/" + groupId + "/giftideas/" + partnerID);

        //display partner name
        db.ref("/users/"+ partnerID).once("value", function(snap){
            $(".partner").text(snap.val().Name);
        });

        partnerItemsInDB.on('child_added', function(snap) {
            console.log(snap.key);
            displayPartnerIdeaChip(snap.key);
        });
    });

    //display username
    db.ref("/users/"+ userID).once("value", function(snap){
        userName = snap.val().Name;
        $(".userName").text(userName);
    });
    //display user's gift ideas
    userItemsInDB.on('child_added', function(snap) {
        console.log(snap.key);
        addNewIdeaChip(snap.key);
    });
    
    db.ref("/groups/"+ groupId)

    //Removing element from HTML, and database
    $("#yourGiftIdeas").on("click", ".material-icons.close", function(event) {
        var par = $(event.target).parent().attr("data-name");
        userItemsInDB.child(par).remove();
    });
    //adding element to DOM, and database
    $("#giftIdeaButton").click(function() {
        var text = $("#giftIdea").val();
        userItemsInDB.child(text).set(text);
        $("#giftIdea").val("");
    });

    // Function to make Walmart API call and Display Results
    function walmartAPI(searchTerm) {
        // var priceRange = 40;

        var key = "bznsyj8ykctspk7c3fr4swkz";
        var url = "https://api.walmartlabs.com/v1/search?";
        
        $.ajax({
            url: url,
            method: "GET",
            jsonp: "callback",
            dataType: "jsonp",
            data: {
                query: searchTerm,
                format: "json",
                    //"facet.range": priceRange, //
                    apiKey: key
                },
            }).done(function(result) {
                console.log(result);
                try{
                    result.items[0];
                }
                catch(err){
                    console.log(err)
                    $("#productDisplay").html("<h3>No goods found</h3>");
                    return 1;
                } 
                for (var i = 0; i < 10; i++) {
                    var newImg = $("<img>");
                    newImg.attr("src", result.items[i].imageEntities[0].mediumImage);
                    var Paragraph = $("<p class='truncate'>");
                    Paragraph.text(result.items[i].name);
                    var Paragraph2 = $("<p>");
                    Paragraph2.text("$" + result.items[i].salePrice);
                    var caruItem = $("<a id=img" + i + ">");
                    caruItem.attr("class", 'carousel-item center-align');
                    caruItem.attr("target", "_blank");
                    caruItem.attr("href", result.items[i].productUrl);
                    caruItem.append(newImg);
                    caruItem.append(Paragraph);
                    caruItem.append(Paragraph2);
                    $("#productDisplay").append(caruItem);
                    $("#img" + i).hammer();
                    $("#img" + i).on("tap", function() {
                        window.open($(this).attr("href"), '_blank');
                    });
                }
                $('.carousel').carousel();
            });
        }

    //Function to make Ebay API call and Display Results
    function ebayAPI(searchTerm) {
        var key = "StephenC-SecretSa-PRD-6132041a0-943144c9";
        var url = "https://svcs.ebay.com/services/search/FindingService/v1";
        
        $.ajax({
            url: url, 
            method: "GET",
            dataType: "jsonp",
            data: {
                "OPERATION-NAME": "findItemsByKeywords",
                "SERVICE-VERSION": "1.0.0",
                "SECURITY-APPNAME": "StephenC-SecretSa-PRD-6132041a0-943144c9",
                "RESPONSE-DATA-FORMAT": "JSON",
                "paginationInput.entriesPerPage": "10",
                keywords: searchTerm
            }
            
        }).done(function(result) {
            console.log(result);

            var short = result.findItemsByKeywordsResponse[0].searchResult[0];
            try{
                short.item[0];
            }
            catch(err){
                if(err) { 
                    console.log(err)
                    $("#productDisplay").html("<h3>No goods found</h3>");
                    return 1;
                }
            } 
            for (var i = 0; i < 10; i++) {
                var newImg = $("<img>");
                newImg.attr("src", short.item[i].galleryURL[0]);
                var Paragraph = $("<p class='truncate'>");
                Paragraph.text(short.item[i].title[0]);
                var Paragraph2 = $("<p>");
                Paragraph2.text("$" + short.item[i].sellingStatus[0].currentPrice[0].__value__);
                var caruItem = $("<a id=img" + i + ">");
                caruItem.attr("class", 'carousel-item center-align');
                caruItem.attr("target", "_blank");
                caruItem.attr("href", short.item[i].viewItemURL[0]);
                caruItem.append(newImg);
                caruItem.append(Paragraph);
                caruItem.append(Paragraph2);
                $("#productDisplay").append(caruItem);
                $("#img" + i).hammer();
                $("#img" + i).on("tap", function() {
                    window.open($(this).attr("href"), '_blank');
                });
            }
            $('.carousel').carousel();
        });
    }

    // Product Display Carousel on partner gift idea "chip" click
    var store = "walmart";
    var searchTerm;
    
    $(document).on("click","#walmart", function() {
      if (store !== "walmart") {
        $('.carousel').carousel('destroy');
        $("#productDisplay").empty();
        store = "walmart";
        walmartAPI(searchTerm);
    }
});

    $("#signOut").click(function(){
        sessionStorage.setItem("userid", "");
        window.location.assign("index.html");
    });
    $("#switchGroup").click(function(){
        window.location.assign("group.html");
    });



    $(document).on("click","#ebay", function() {
        if (store !== "ebay") {
            $('.carousel').carousel('destroy');
            $("#productDisplay").empty();
            store = "ebay";
            ebayAPI(searchTerm);
        }
    });
    
    $(document).on("click", "#partnerGiftIdeas .chip", function() {

        $("#storeSelection").css("display", "block");
        
        $('.carousel').carousel('destroy');
        $("#productDisplay").css("display", "block");
        $("#productDisplay").empty();
        searchTerm = $(this).text();
        
        if (store === "walmart") {
            walmartAPI(searchTerm);    
        }
        
        if (store === "ebay") {
            ebayAPI(searchTerm);
        }
    });
    
    displayGroupMembers(groupId);
});
