document.getElementById("postButton").addEventListener("click", function () {
  const form = document.getElementById("postForm");
  if (form.classList.contains("show")) {
    form.classList.remove("show");
  } else {
    form.classList.add("show");
  }
});
