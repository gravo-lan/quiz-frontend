let options, questions, solutions, leaderboard, timerId, username;
let score = 0;
let progress = 0;
let started = false;
let selected = false;
let timeLeft;
let totalTime = 0;
let userAnswers = [];

const HOME_URL = document.URL;
const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get('id');

const searchBtn = document.getElementById("search-btn");
const quizBtn = document.getElementById("quiz-btn");
const nameInput = document.getElementById("name");

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

const fetchLeaderboard = async () => {
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

const hidden = [document.getElementById("timer"),document.getElementById("options"),document.getElementById("progbar"),document.getElementById("score"),document.getElementById("progress"),document.getElementById("help")]

function errorMessage() {
    document.getElementById("blurb").innerText = "Please try again later";
    searchBtn.style.display = "none";
    quizBtn.style.display = "none";
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
    const nameInput = document.getElementById("name");
    const name = nameInput.value.trim();
    
    if (!name) {
        alert("Please input a name.");
        return;
    }
    
    hide(false);
    started = true;
    quizBtn.innerText = "Next";
    username = name;
    nameInput.style.display = "none";
    advance();
}

function finish() {
    hide(true);
    document.getElementById("question").style.display="none";
    quizBtn.style.display="none";
    document.getElementById("info").innerText = "You did it!";
    
    const totalTimeTaken = (solutions.length * 10) - totalTime;
    document.getElementById("blurb").innerText = "You got: " + score + "/" + solutions.length + "!\nTime taken: " + totalTimeTaken + " seconds";

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
    searchBtn.classList.toggle('hidden', !bool);
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
        document.getElementById("blurb").innerText += "\n\nFailed to save results. Please try again later.";
    }
}

function searchQuiz() {
    const quizId = document.getElementById("search-input").value.trim();
    
    if (!quizId) {
        alert("Please enter a quiz ID");
        return;
    }

    searchBtn.disabled = true;
    searchBtn.innerText = "Loading...";
    
    const cleanUrl = new URL(window.location.origin + window.location.pathname);
    cleanUrl.searchParams.set("id", quizId);
    window.location.href = cleanUrl.toString();
}

function setupEventListeners() {
    for (let i = 1; i < 5; i++) {
        document.getElementById("opt" + i).addEventListener("click", () => {
            if (!selected) {
                selection(i);
            }
        });
    }

    document.getElementById("search-form").addEventListener("submit", function(e) {
        e.preventDefault();
        searchQuiz();
    });

    quizBtn.addEventListener("click", function() {
        if (started) {
            advance();
        } else {
            start();
        }
    });

    document.getElementById("name").addEventListener("keypress", function(e) {
        if (e.key === "Enter") {
            e.preventDefault();
            if (id && !started) {
                start();
            }
        }
    });

    document.getElementById("hint").addEventListener("click", async ()=>{
        document.getElementById("loading").style.display="block";
        clearInterval(timerId);
        const questionText = document.getElementById("question").innerText || "";
        try {
            console.log("Sending to hint webhook:", questionText);
            
            const response = await fetch(`https://gravolan.app.n8n.cloud/webhook/d481ef09-28ac-49b7-9ead-e791a2ead99b`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: questionText
                }.message)
            });

            if (!response.ok) {
                throw new Error(`HTTP Error! status: ${response.status}`)
            }

            const result = await response.json();
            document.getElementById("loading").style.display="none";
            const parsedReply = JSON.parse(result[0].reply);
            console.log(parsedReply.content.hint);
            alert("Hint: " + parsedReply.content.hint);
        } catch (error) {
            alert("Couldn't fetch an AI hint! Try again later...");
            console.error("Error fetching AI hint:",error);
        } finally {
            if (!selected) timerId = setInterval(countdown, 1000);
        }
    });

    document.getElementById("solution").addEventListener("click", async ()=>{
        document.getElementById("loading").style.display="block";
        clearInterval(timerId);
        const questionText = document.getElementById("question").innerText || "";
        const solutionText = options[progress-1][solutions[progress-1]] || "";
        try {
            console.log("Sending to solution webhook:", questionText);
            
            const response = await fetch(`https://gravolan.app.n8n.cloud/webhook/3733e655-1f7a-447f-becc-2eb06f0ab6b4`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    solution: solutionText,
                    question: questionText
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP Error! status: ${response.status}`)
            }
            
            const result = await response.json();
            timeLeft = 0;
            clearTimeout(timerId);
            selected=true;
            document.getElementById("opt"+solutions[progress-1]).style.backgroundColor = "green";
            document.getElementById("loading").style.display="none";
            const parsedReply = JSON.parse(result[0].reply);
            console.log(parsedReply);
            alert("Correct Answer: " + parsedReply.content.correct_answer + "\nExplanation: " + parsedReply.content.explanation);
        } catch (error) {
            alert("Couldn't fetch an AI  solution! Try again later...");
            console.error("Error fetching AI solution:",error);
        } finally {
            if (!selected) timerId = setInterval(countdown, 1000);
        }
    });
}

hide(true);

if (!id) {
    document.getElementById("loading").style.display = "none";
    document.getElementById("info").innerText = "Quiz Site";
    document.getElementById("blurb").innerText = "A quiz website that can host custom modular quizzes.";
    document.getElementById("search-input").placeholder = "Enter quiz ID";
    document.getElementById("name-container").style.display = "none"; // Hide name field
    searchBtn.style.display = "inline";
    quizBtn.style.display = "none";
} else {
    fetchData().then(data => {
        options = data.options;
        questions = data.questions;
        solutions = data.solutions;
        
        console.log(data, data.title, data.desc);

        document.getElementById("info").innerText = data.title || "Quiz";
        document.getElementById("blurb").innerText = data.desc || "Test your knowledge";
        
        hide(true);
        
        document.getElementById("search-input").style.display = "none";
        document.getElementById("name-container").style.display = "block";
        document.getElementById("name").value = "";
        document.getElementById("name").placeholder = "Enter your name";
        searchBtn.style.display = "none";
        quizBtn.style.display = "inline";
        quizBtn.innerText = "Start";
    }).catch(error => {
        console.error("Error loading quiz data:", error);
        document.getElementById("info").innerText = "Error Loading Quiz";
        errorMessage();
    });

    fetchLeaderboard().then(data => {
        leaderboard = data;
    }).catch(error => {
        console.error("Error loading leaderboard data:", error);
        document.getElementById("info").innerText = "Error Loading Leaderboard";
        errorMessage();
    });
}

setupEventListeners();