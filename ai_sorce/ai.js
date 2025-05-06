document.getElementById("send-btn").addEventListener("click", sendMessage);
document.getElementById("user-input").addEventListener("keypress", function(e) {
  if (e.key === "Enter") {
    sendMessage();
  }
});

// Ovoz chiqarish rejimi
let voiceEnabled = true;

// Chatbot xotirasi (localStorage)
let chatMemory = JSON.parse(localStorage.getItem("chatMemory")) || {};
// Sinonimlar bazasi

// Chatbot xotirasini saqlash
function saveMemory() {
  localStorage.setItem("chatMemory", JSON.stringify(chatMemory));
}

// Chatbot javob topish funksiyasi
function getAnswer(question) {
  for (let item of knowledgeBase) {
    if (item.savol.toLowerCase() === question.toLowerCase()) {
      return item.javob;
    }
  }
  
  for (let key in synonyms) {
    if (synonyms[key].some(syn => syn.toLowerCase() === question.toLowerCase())) {
      return knowledgeBase.find(q => q.savol === key)?.javob || "Men bu savolga javob bilmayman.";
    }
  }
  
  return null;
}

// Savollarni tavsiya qilish funksiyasi
document.getElementById("user-input").addEventListener("input", function() {
  let inputText = this.value.toLowerCase();
  let suggestionsBox = document.getElementById("suggestions");
  suggestionsBox.innerHTML = "";
  
  if (inputText.length > 1) {
    let matches = knowledgeBase.filter(q => q.savol.toLowerCase().includes(inputText));
    matches.forEach(match => {
      let li = document.createElement("li");
      li.textContent = match.savol;
      li.addEventListener("click", function() {
        document.getElementById("user-input").value = match.savol;
        suggestionsBox.innerHTML = "";
      });
      suggestionsBox.appendChild(li);
    });
  }
});

// Ovoz chiqarish funksiyasi
function speakText(text) {
  if (voiceEnabled && "speechSynthesis" in window) {
    let voices = window.speechSynthesis.getVoices();
    let uzbekVoice = voices.find(voice => voice.lang === "uz-UZ") || voices.find(voice => voice.lang.includes("tr") || voice.lang.includes("en"));
    
    let speech = new SpeechSynthesisUtterance(text);
    speech.rate = 1;
    speech.pitch = 1;
    speech.volume = 1;
    
    if (uzbekVoice) {
      speech.voice = uzbekVoice;
    } else {
      console.warn("O‘zbekcha ovoz topilmadi, o‘rniga boshqa ovoz ishlatilmoqda.");
    }
    
    window.speechSynthesis.speak(speech);
  }
}

// Ovozlarni yuklash (ba’zi brauzerlar uchun kerak)
window.speechSynthesis.onvoiceschanged = function() {
  console.log("Ovozlar yangilandi:", window.speechSynthesis.getVoices());
};

// Ovoz chiqarishni yoqish/o‘chirish tugmalari
document.getElementById("voice-on-btn").addEventListener("click", function() {
  voiceEnabled = true;
  alert("Ovoz chiqarish yoqildi! 🔊");
});

document.getElementById("voice-off-btn").addEventListener("click", function() {
  voiceEnabled = false;
  alert("Ovoz chiqarish o‘chirildi! 🔇");
});

// Foydalanuvchi xabar jo‘natishi
function sendMessage() {
  let userInput = document.getElementById("user-input").value.trim();
  if (userInput === "") return;
  
  let chatBody = document.getElementById("chat-body");
  
  let userMessage = document.createElement("div");
  userMessage.classList.add("message", "user-message");
  userMessage.textContent = userInput;
  chatBody.appendChild(userMessage);
  document.getElementById("user-input").value = "";
  
  setTimeout(() => {
    let botMessage = document.createElement("div");
    botMessage.classList.add("message", "bot-message");
    
    let botResponse = getAnswer(userInput);
    
    if (chatMemory[userInput]) {
      botMessage.textContent = chatMemory[userInput];
    } else if (botResponse) {
      botMessage.textContent = botResponse;
    } else {
      botMessage.textContent = "Men bu savolga javob bilmayman. To‘g‘ri javobni yozing:";
      setTimeout(() => {
        let answer = prompt("Bu savolga qanday javob berish kerak?");
        if (answer) {
          chatMemory[userInput] = answer;
          saveMemory();
          knowledgeBase.push({ savol: userInput, javob: answer });
          
          let confirmMessage = document.createElement("div");
          confirmMessage.classList.add("message", "bot-message");
          confirmMessage.textContent = "Rahmat! Endi bu savolga javob bera olaman.";
          chatBody.appendChild(confirmMessage);
          
          speakText(confirmMessage.textContent);
        }
      }, 1000);
    }
    
    chatBody.appendChild(botMessage);
    chatBody.scrollTop = chatBody.scrollHeight;
    
    // Ovoz chiqarish
    speakText(botMessage.textContent);
  }, 500);
}

// Chat tarixini tozalash tugmasi
document.getElementById("clear-chat-btn").addEventListener("click", function() {
  localStorage.removeItem("chatMemory");
  document.getElementById("chat-body").innerHTML = "";
});


