const game = document.getElementById("game");
const scene = document.getElementById("scene");
const message = document.getElementById("message");
const title = document.getElementById("title");

/* coordenada do Bulaxa escondido */
const bulaxa = {
  x: 970,
  y: 150,
  w: 60,
  h: 80
};

let found = false;

game.addEventListener("click", (e) => {
  if (found) return;

  const rect = game.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const hit =
    x >= bulaxa.x &&
    x <= bulaxa.x + bulaxa.w &&
    y >= bulaxa.y &&
    y <= bulaxa.y + bulaxa.h;

  if (hit) {
    found = true;

    scene.src = "assets/bulaxa.png";

    title.textContent = "Parabéns, você achou o Bulaxa!";

    message.textContent = "";

    game.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }
});
