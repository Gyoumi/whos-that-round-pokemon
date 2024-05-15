// nav bar 
const nav_top = document.querySelector('#nav-top');
const nav_guesses = document.querySelector('#nav-guesses');
const nav_custom_guess = document.querySelector('#nav-custom-guess');
const nav_all_guesses = document.querySelector('#nav-all-guesses');
const nav_answer = document.querySelector('#nav-answer');

nav_top.addEventListener('click', () => {
    document.getElementById('welcome').scrollIntoView();
});

nav_guesses.addEventListener('click', () => {
    document.getElementById('page').scrollIntoView();
});

nav_custom_guess.addEventListener('click', () => {
    document.getElementById('guess').scrollIntoView();
});

nav_all_guesses.addEventListener('click', () => {
    document.getElementById('all-guesses').scrollIntoView();
});

nav_answer.addEventListener('click', () => {
    document.getElementById('answer-div').scrollIntoView();
});


// script
const audio = document.querySelector('#audio');
const audio_volume = document.querySelector('#audio-volume');
audio.volume = 0.25;

const form = document.querySelector('#custom-guess-form');
const wrong_answer_div = document.querySelector('#wrong-answer');
const guess_again = document.querySelector('#guess-again');
const custom_guess_div = document.querySelector('#custom-guess-div');
const session_guesses = new Set();

const show_guesses_button = document.querySelector('#show-guesses');
const show_guesses_text = document.querySelector('#show-guesses-text');
const canvas = document.getElementById('guesses')
const canvas_container = document.getElementById('canvas-container');

const give_up = document.getElementById('give-up');
const show_answer = document.querySelector('#show-answer');
const show_answer_text = document.querySelector('#show-answer-text');
const audio_playing_ani = document.querySelector('#wave');

const answer = document.getElementById('answer');
const discord_pfp = document.querySelector('#discord-pfp');
const discord_add_msg = document.querySelector('#discord-add-msg');

const mystery_img = document.getElementById('result-mystery');

var displaying_wordcloud = false;
var displaying_answer = false;

function checkGuess(guess) {
    guess_words = guess.split(" ");
    if(guess_words.includes("discord") && guess_words.includes("eternatus")) {
        if(guess_words.length > 2) {
            if(!displaying_answer) {
                give_up.innerHTML = "Who's that Pokémon?";
                nav_answer.innerHTML = "Answer";
                document.getElementById('nav-reset').style.display = "flex";
                revealAnswer(true);
            }
            return true;
        } 
    }

    custom_guess_div.style.display = "none";
    wrong_answer_div.style.display = "block";

    return false;
}

async function submitGuess(e, guess) {
    try {
        const res = await fetch('http://localhost:8000', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({guess})
        });

        if(!res.ok) {
            throw new Error('Failed to submit guess');
        }
        console.log(guess);
        displaying_wordcloud = !displaying_wordcloud;
        showGuesses(e);
    } catch (error) {
        console.error(error);
    }
}

// Submit guess
async function makeGuess(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const raw_guess = formData.get('custom-guess').toLowerCase();
    const guess = raw_guess.split(" ").map((word) => {
        if((word.length === 4 || word.length > 6) && word.substring(0, 4) === "poke") {
            return "poké" + word.substring(4);
        }
        return word;
    }).join(" ");

    document.forms['custom-guess-form'].reset();

    if(!session_guesses.has(guess) && !checkGuess(guess)) {
        submitGuess(e, guess);

        session_guesses.add(guess);

        custom_guess_div.style.display = "none";
        wrong_answer_div.style.display = "block";
    }
    console.log(JSON.stringify({guess}));
}

// display guesses (as wordcloud)
async function showGuesses(e) {
    if(displaying_wordcloud) {
        WordCloud.stop
        displaying_wordcloud = false;

        canvas.style.display = "none";
        canvas_container.style.height = 0;
        show_guesses_text.innerHTML = "Show all guesses!";
        const hide_guesses_imgs = document.getElementsByClassName('hide-guesses-img');

        [...hide_guesses_imgs].forEach(img => {
            img.classList.remove('hide-guesses-img');
            img.classList.add('show-guesses-img');
        });
        return;
    }

    const res = await fetch('http://localhost:8000');
    if(!res.ok) {
        throw new Error('Failed to fetch all guesses');
    }

    const data = await res.json();

    //const guesses = [];

    console.log(WordCloud.isSupported);

    if(WordCloud.isSupported) {
        createWordCloud(data);
    } else {
        console.log(data);
    }    

    show_guesses_text.innerHTML = "Hide all guesses";

    const show_guesses_imgs = document.getElementsByClassName('show-guesses-img');
    [...show_guesses_imgs].forEach(img => {
        img.classList.remove('show-guesses-img');
        img.classList.add('hide-guesses-img');
    });
}

function createWordCloud(guesses) {
    if(guesses.length < 1) return;
    const data = new Array();

    let maxCount = 0;
    let guessCounts = new Map();

    guesses.forEach((guess) => {
        data.push( 
            [
                guess.guess,
                guess.count
            ]
        );

        if(!guessCounts.has(guess.count)) {
            guessCounts.set(guess.count, 0);
        }

        guessCounts.set(guess.count, guessCounts.get(guess.count)+1)
        maxCount = Math.max(maxCount, guess.count);
    });

    canvas_container.style.height = "50vh";

    
    //const data = [['pokeball', 20], ['ultra ball', 90], ['jigglypuff as seen from above', 150], ['voltorb', 50], ['electrode', 30], ['golem', 60]];
    
    let y = canvas_container.offsetHeight
    let x = canvas_container.offsetWidth
    canvas.height = y;
    canvas.width = x;

    console.log("gridsize:" , x);
    WordCloud(canvas, {
        list: data,
        fontFamily: 'pokemon-solid',
        color: 'random-light',
        gridSize: 0,
        weightFactor: (amnt) => (amnt * (y / (maxCount * (maxCount / 2))) + (1/(amnt/maxCount))) * ((2048 * guessCounts.get(amnt) - (guessCounts.get(amnt)+1)) / (2048 * guessCounts.get(amnt))), 
        backgroundColor: '#1C1C1C',
        origin: [x*0.5, y*0.45],
        drawOutOfBound: true,
    });
    canvas.style.display = "block";
    displaying_wordcloud = true;
}

function showAnswer() {
    if(displaying_answer) {
        answer.style.display = "none";
        show_answer_text.innerHTML = "Reveal answer!";
        give_up.innerHTML = "Give up?";
        displaying_answer = false;
        mystery_img.classList.remove('result-transparent');
        mystery_img.classList.remove('result-transition');
        return;
    }
    
    revealAnswer(false);
}

function revealAnswer(user_guessed) {
    give_up.scrollIntoView(true, {behavior: "smooth"});
    audio.play();
    show_answer_text.innerHTML = "";
    audio_playing_ani.style.display = "flex";

    audio.addEventListener("timeupdate", () => {
        if(audio.currentTime >= 6.7) {
            audio_playing_ani.style.display = "none";
            show_answer_text.innerHTML = "It's...";

            mystery_img.classList.add('result-transparent');
            mystery_img.classList.add('result-transition');
            setTimeout(() => {
                audio.currentTime = 0;
                answer.style.display = "flex";
                give_up.scrollIntoView(true, {behavior: "smooth"});
                displaying_answer = true;
                show_answer_text.innerHTML = "Hide answer!";
            
                answ_text = "";
                if(user_guessed) {
                    answ_text += "Congratulations, you got it!! ";
                    show_answer.style.display = "none";
                } 
            
                answ_text += "It's...";
                give_up.innerHTML = answ_text;
            }, 990);
        }
    });
}

function copyDiscordName() {
    navigator.clipboard.writeText("gumm");
    discord_add_msg.innerHTML = "Copied!";
}

function discordMouseOut() {
    discord_add_msg.innerHTML = "Click above to copy my Discord name!";
}

function displayForm() {
    custom_guess_div.style.display = "block";
    wrong_answer_div.style.display = "none";
}

function adjustSlider(e) {
    const slider_val = e.target.value;
    const progress = (slider_val / audio_volume.max) * 100;

    audio_volume.style.background = `linear-gradient(to right, red ${progress}%, #696969 ${progress}%)`;
    audio.volume = slider_val / 200;
};

// event listeners
console.log("ready!");
form.addEventListener('submit', makeGuess);
guess_again.addEventListener('click', displayForm);
show_guesses_button.addEventListener('click', showGuesses);
show_answer.addEventListener('click', showAnswer);
discord_pfp.addEventListener('click', copyDiscordName);
discord_pfp.addEventListener('mouseout', discordMouseOut);
audio_volume.addEventListener("input", adjustSlider);