let carouselIndexes = [-1];
const ANIM_DURATION = 200;
const transitionValue = `transform ${ANIM_DURATION}ms ease-in-out 0s`;

let touchstartX = 0;
let touchstartY = 0;
let touchendX = 0;
let touchendY = 0;

function dragStartNone(ev) {
  ev.preventDefault();
}

function dragOverHandler(ev) {
  ev.preventDefault();
}

function dropHandler(ev) {
  ev.preventDefault();

  let fileToRead;
  if (ev.dataTransfer.items) {
    [...ev.dataTransfer.items].forEach((item, i) => {
      if (item.kind === 'file') {
        fileToRead = item.getAsFile();
      }
    });
  } else {
    [...ev.dataTransfer.files].forEach((file, i) => {
      fileToRead = file;
    });
  }
  const reader = new FileReader();
  reader.onload = function (event) {
    eval(event.target.result);
    onLoad();
  };
  reader.readAsText(fileToRead);
}

function onLoad() {
  carouselIndexes = [-1];
  carouselIndexes.pop();
  jQuery(() => {
    $(".post-container:not(#post-template)").remove();
    let templateEl = $("#post-template").first();
    for (let postIndex = 0; postIndex < posts.length; postIndex++) {
      const post = posts[postIndex];
      carouselIndexes.push(0);

      let newPost = $(templateEl).clone();
      newPost.css("display", "");
      newPost.removeAttr("id");
      const carouselEl = newPost.find(".carousel").first();

      const imageEl = newPost.find(".post-image");
      const videoEl = newPost.find(".post-video");

      if (typeof post.post_content_url === "string") {
        const isVideo = post.post_content_url.endsWith(".mp4");
        let elementToSet = imageEl;
        if (isVideo) {
          elementToSet = videoEl;
        }
        elementToSet.attr("src", post.post_content_url);
        elementToSet.css({ display: "block", position: "relative" });
        newPost.find(".prev-button").css("display", "none");
        newPost.find(".next-button").css("display", "none");
      } else {
        const urls = post.post_content_url; // urls: string[]
        newPost.find(".image-placeholder").attr("src", urls[0]);
        for (let i = 0; i < urls.length; i++) {
          const isVideo = urls[i].endsWith(".mp4");
          const newEl = imageEl.clone();
          if (isVideo) {
            newEl = videoEl.clone();
          }
          newEl.get(0).addEventListener("dragstart", function (ev) {
            dragStartNone(ev);
          });
          newEl.get(0).addEventListener("touchstart", function (ev) {
            touchstartX = ev.touches[0].screenX;
            touchstartY = ev.touches[0].screenY;
          });
          newEl.get(0).addEventListener("touchend", function (ev) {
            touchendX = ev.changedTouches[0].screenX;
            touchendY = ev.changedTouches[0].screenY;
            handleGesture(carouselEl, postIndex, urls.length - 1)(ev);
          });
          newEl.attr("src", urls[i]);
          newEl.css({
            display: "block",
            transition: transitionValue,
            transform: `translateX(${i === 0 ? 0 : 100}%)`,
          });
          carouselEl.append(newEl);
        }
        imageEl.remove();
        videoEl.remove();
        newPost.find(".prev-button").css("display", "none");
        newPost.find(".prev-button").on("click", prevSlide(carouselEl, postIndex, urls.length - 1));
        newPost.find(".next-button").on("click", nextSlide(carouselEl, postIndex, urls.length - 1));
      }

      newPost.find(".ph-account-name").each((index, el) => {
        el.innerHTML = post.account_name;
      })

      newPost.find(".ph-account-likes-it").html(post.account_likes_it);

      post.post_text = post.post_text.replace(/(\B(\#[a-zA-Z??????????]+\b)(?!;))/g, "<hashtag>$1</hashtag>");
      newPost.find(".ph-post-text").html(post.post_text);

      newPost.find(".ph-show-comments-text").html(post.show_comments_text);
      newPost.find(".ph-post-date").html(post.post_date.toUpperCase());

      templateEl.parent().append(newPost);
    }
    templateEl.css("display", "none");
  });
}

function prevSlide(carouselEl, postIndex, maxImageIndex) {
  return () => {
    moveImg(carouselEl, postIndex, maxImageIndex, false);
  }
}

function nextSlide(carouselEl, postIndex, maxImageIndex) {
  return () => {
    moveImg(carouselEl, postIndex, maxImageIndex, true);
  }
}

function moveImg(carouselEl, postIndex = -1, maxImageIndex = -1, next = false) {
  const currIndex = carouselIndexes[postIndex];
  const nextIndex = next ? Math.min(maxImageIndex, currIndex + 1) : Math.max(0, currIndex - 1);

  $(carouselEl).siblings(".prev-button").css("display", nextIndex === 0 ? "none" : "");
  $(carouselEl).siblings(".next-button").css("display", nextIndex === maxImageIndex ? "none" : "");
  if (nextIndex === currIndex) return;

  carouselIndexes[postIndex] = nextIndex;
  const imgEl = $(carouselEl).find(".post-image");

  // senza animazione
  imgEl.eq(nextIndex).css({
    display: "block",
    transition: "",
    transform: `translateX(${next ? 100 : 100}%)`
  });
  imgEl.eq(currIndex).css({
    display: "block",
    transition: "",
    transform: `translateX(0%)`
  });

  // con animazione
  imgEl.eq(nextIndex).css({
    display: "block",
    transition: transitionValue,
    transform: `translateX(0%)`
  });
  imgEl.eq(currIndex).css({
    display: "block",
    transition: transitionValue,
    transform: `translateX(${next ? -100 : 100}%)`
  });

  setTimeout(() => {
    $(carouselEl).find(".image-placeholder").attr("src", imgEl.eq(nextIndex).attr("src"));
  }, ANIM_DURATION);

}

const pageWidth = window.innerWidth || document.body.clientWidth;
const treshold = Math.max(1, Math.floor(0.01 * (pageWidth)));
const limit = Math.tan(45 * 1.5 / 180 * Math.PI);

function handleGesture(carouselEl, postIndex, maxImageIndex) {
  return (e) => {
    let x = touchendX - touchstartX;
    let y = touchendY - touchstartY;
    let xy = Math.abs(x / y);
    let yx = Math.abs(y / x);
    if (Math.abs(x) > treshold || Math.abs(y) > treshold) {
      if (yx <= limit) {
        if (x < 0) {
          nextSlide(carouselEl, postIndex, maxImageIndex)();
        } else {
          prevSlide(carouselEl, postIndex, maxImageIndex)();
        }
      }
      if (xy <= limit) {
        if (y < 0) {
          console.log("top");
        } else {
          console.log("bottom");
        }
      }
    } else {
      console.log("tap");
    }
  };
}
