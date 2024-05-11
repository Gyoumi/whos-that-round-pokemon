const form = document.querySelector('#custom-guess-form');
const show_guesses_button = document.querySelector('#show-guesses');
const guesses = document.querySelector('#guesses');
const canvas = document.getElementById('guesses')

const show_answer = document.querySelector('#show-answer');
const answer = document.getElementById('answer');

var displaying_wordcloud = false;
var displaying_answer = false;

// Submit guess
async function makeGuess(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const guess = formData.get('custom-guess');
    console.log(JSON.stringify({guess}));

    try {
        const res = await fetch('http://localhost:8000', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({guess})
        });

        document.forms['custom-guess-form'].reset();

        if(!res.ok) {
            throw new Error('Failed to submit guess');
        }

        displaying_wordcloud = !displaying_wordcloud;
        showGuesses(e);
    } catch (error) {
        console.error(error);
    }
}

// display guesses (as wordcloud)
async function showGuesses(e) {
    if(displaying_wordcloud) {
        WordCloud.stop
        displaying_wordcloud = false;

        canvas.style.display = "none";
        show_guesses_button.innerHTML = "Show all guesses!";

        return;
    }

    const res = await fetch('http://localhost:8000');
    if(!res.ok) {
        throw new Error('Failed to fetch all guesses');
    }

    const guesses = await res.json();

    //const guesses = [];

    console.log(WordCloud.isSupported);

    if(WordCloud.isSupported) {
        createWordCloud(guesses);
    } else {
        console.log(guesses);
    }    

    show_guesses_button.innerHTML = "Hide all guesses";
}

function createWordCloud(guesses) {
    const data = [];
    guesses.forEach((guess) => {
        data.push( 
            [
                guess.guess,
                guess.count * 20
            ]
        );
    });

    //const data = [['pokeball', 20], ['ultra ball', 90], ['jigglypuff as seen from above', 150], ['voltorb', 50], ['electrode', 30], ['golem', 60]];

    WordCloud(canvas, {
        list: data,
        drawOutOfBound: false,
        shrinkToFit: true,
        fontFamily: 'pokemon-solid',
        color: 'random-light',
    });

    canvas.style.display = "block";
    displaying_wordcloud = true;
}

function showAnswer() {
    if(displaying_answer) {
        answer.style.display = "none";
        show_answer.innerHTML = "Show answer!"
        displaying_answer = false;
        return;
    }
    answer.style.display = "block";
    show_answer.innerHTML = "Hide answer!"
    displaying_answer = true;
}

// event listeners
console.log("ready!");
form.addEventListener('submit', makeGuess);
show_guesses_button.addEventListener('click', showGuesses);
show_answer.addEventListener('click', showAnswer);
