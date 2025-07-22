let options, questions, solutions, leaderboard, timerId, username;
let score = 0;
let progress = 0;
let started = false;
let selected = false;
let timeLeft;
let totalTime = 0;
let userAnswers = [];

const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get('id');

const API_URL = "https://quiz-backend-junk.onrender.com";

const fetchData = async () => {
    document.getElementById("text").style.display="none";
    document.getElementById("options").style.display="none";
    document.getElementById("progbar").style.display="none";
    document.getElementById("question").style.display="none";
    document.getElementById("loading").style.display="display";
    try {
        const response = await fetch(`${API_URL}/api/data/${id}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`)
        }
        document.getElementById("text").style.display="inline";
        document.getElementById("options").style.display="inline";
        document.getElementById("progbar").style.display="inline";
        document.getElementById("question").style.display="block";
        document.getElementById("loading").style.display="none";
        return await response.json();
    } catch (error) {
        console.error("Error loading quiz data:", error)
        document.getElementById("info").innerText = "Error Loading Quiz";
        errorMessage();
    }
};

const fetchLeadeboard = async () => {
    try {
        const response = await fetch(`${API_URL}/api/submissions/${id}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`)
        }
        return await response.json();
    } catch (error) {
        console.error("Error loading leaderboard data", error)
        document.getElementById("info").innerText = "Error Loading Quiz";
        errorMessage();
    }
}

const hidden = [document.getElementById("timer"),document.getElementById("options"),document.getElementById("progbar"),document.getElementById("score"),document.getElementById("progress")]

function errorMessage() {
    document.getElementById("blurb").innerText = "Please try again later";
    document.getElementById("submit").style.display = "none";
    document.getElementById("name").style.display = "none";
    document.getElementById("info").style.display = "block";
    document.getElementById("blurb").style.display = "block";
}

function countdown() {
    if (timeLeft == -1) {
        clearTimeout(timerId);
        selected=true;
        document.getElementById("opt"+solutions[progress-1]).style.backgroundColor = "green";
        document.getElementById('timer').innerText = 'Time is up!';
    } else if (!selected) {
        document.getElementById('timer').innerText = timeLeft + ' seconds remaining';
        timeLeft--;
    }
}

function advance() {
    if (progress>0 && !selected) alert("Please choose an option!")
    else if (progress==solutions.length) finish();
    else if (started){
        if (progress<solutions.length) progress++;
        clearTimeout(timerId);
        timerId = setInterval(countdown, 1000);
        timeLeft = 10;
        document.getElementById("timer").style.display = "inline";
        update();
        countdown();
        document.getElementById("progbar").style.width = (100*(progress)/solutions.length) + "%";
        return progress;
    }
    else start();
}

function update() {
    document.getElementById("question").innerText = questions[progress-1];
    for (let i = 1; i<5; i++) document.getElementById("opt"+i).innerText = options[progress-1][i-1];
    document.getElementById("progress").innerText = "Q. " + (progress) + "/" + solutions.length;
    selected = false;
    for (let i = 1; i<5; i++) {
        document.getElementById("opt"+i).style.backgroundColor = "rgb(90, 95, 108)";
    }
}

function start() {
    const name = document.getElementById("name");
    if (name.value == "Input your name...") {
        alert("Please input a name.");
        return false;
    }
    hide(false);
    started=true;
    document.getElementById("submit").innerText = "Next";
    username = document.getElementById("name").value;
    document.getElementById("name").style.display = "none";
    advance();
}

function finish() {
    hide(true);
    document.getElementById("question").style.display="none";
    document.getElementById("submit").style.display="none";
    document.getElementById("info").innerText = "You did it!";
    
    // Calculate total time taken
    const totalTimeTaken = (solutions.length * 10) - totalTime;
    document.getElementById("blurb").innerText = "You got: " + score + "/" + solutions.length + "!\nTime taken: " + totalTimeTaken + " seconds";

    // Submit results to server
    submitResults(score, totalTimeTaken, userAnswers, id, username);
    showLeaderboard();
}

function showLeaderboard() {
    const tbl = document.getElementById("table");
    const tblBody = document.getElementById("tablebody");
    tbl.style.display = "block";
    for (let i = 0; i < leaderboard.length; i++) {
        const row = document.createElement("tr");
        const c1 = document.createElement("td");
        const c2 = document.createElement("td");
        const c3 = document.createElement("td");
        const c4 = document.createElement("td");
        const c1text = document.createTextNode(leaderboard[i].name);
        const c2Text = document.createTextNode(leaderboard[i].score);
        const c3Text = document.createTextNode(leaderboard[i].timeTaken);
        const c4Text = document.createTextNode(leaderboard[i].timestamp);
        c1.appendChild(c1text);
        c2.appendChild(c2Text);
        c3.appendChild(c3Text);
        c4.appendChild(c4Text);
        row.appendChild(c1);
        row.appendChild(c2);
        row.appendChild(c3);
        row.appendChild(c4);
        tblBody.appendChild(row);
    }
}

function hide(bool) {
    const x = (bool)? "none":"inline";
    const y = (bool)? "inline":"none";
    for (let i = 0; i<hidden.length; i++) hidden[i].style.display = x;
    document.getElementById("info").style.display = y;
    document.getElementById("blurb").style.display=y;
}

function selection(option) {
    selected = true;
    
    userAnswers[progress-1] = {
        questionIndex: progress-1,
        selectedOption: option,
        correct: (option === solutions[progress-1]),
        timeTaken: 10 - timeLeft
    };
    
    if (option == solutions[progress-1]) {
        document.getElementById("opt"+option).style.backgroundColor = "green";
        score++;
    } else {
        document.getElementById("opt"+option).style.backgroundColor = "red";
        document.getElementById("opt"+solutions[progress-1]).style.backgroundColor = "green";
    }
    
    document.getElementById("score").innerText = "Score: " + score;
    totalTime += timeLeft; 
    document.getElementById("timer").style.display = "none";
}

async function submitResults(score, timeTaken, answers, id, username) {
    const submissionData = {
        quizId: id,
        score: score,
        timeTaken: timeTaken,
        answers: answers,
        name: username
    };

    console.log(JSON.stringify(submissionData));

    try {
        const response = await fetch(`${API_URL}/api/submit`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(submissionData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log("Submission successful:", result);
    } catch (error) {
        console.error("Error submitting results:", error);
        // Optional: Show error message to user
        document.getElementById("blurb").innerText += "\n\nFailed to save results. Please try again later.";
    }
}

hide(true);

if (!id) {
    document.getElementById("loading").style.display = "none";
    document.getElementById("info").innerText = "Quiz Site";
    document.getElementById("blurb").innerText = "A quiz website that can host custom modular quizzes.";
    document.getElementById("name").value = "Enter a quiz ID";
    document.getElementById("submit").innerText = "Search";
    document.getElementById("submit").addEventListener("click", ()=>{window.location.href=document.URL + "?id=" + document.getElementById("name").value})
} else {
    fetchData().then(data => {
        options = data.options;
        questions = data.questions;
        solutions = data.solutions;
        
        console.log(data,data.title,data.desc);

        document.getElementById("info").innerText = data.title || "Quiz";
        document.getElementById("blurb").innerText = data.desc || "Test your knowledge";
        
        hide(true);
        document.getElementById("submit").innerText = "Start";
    }).catch(error => {
        console.error("Error loading quiz data:", error);
        document.getElementById("info").innerText = "Error Loading Quiz";
        errorMessage();
    });

    fetchLeadeboard().then(data => {
            leaderboard=data;
        }).catch(error => {
            console.error("Error loading leaderboard data:", error);
            document.getElementById("info").innerText = "Error Loading Leaderboard";
            errorMessage();
        });
}

for (let i = 1; i<5; i++) {
    document.getElementById("opt"+i).addEventListener("click", ()=>{if(!selected) {selection(i)}})
}
document.getElementById("submit").addEventListener("click", ()=>advance());
