let carouselIndexes = [-1];
const ANIM_DURATION = 200;
const transitionValue = `transform ${ANIM_DURATION}ms ease-in-out 0s`;

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

      if (post.is_image) {
        newPost.find(".post-image").css("display", "block");
      } else {
        newPost.find(".post-video").css("display", "block");
      }

      if (typeof post.post_content_url === "string") {
        let elementToSet = newPost.find(".post-image");
        if (!post.is_image) {
          elementToSet = newPost.find(".post-video");
        }
        elementToSet.attr("src", post.post_content_url);
        elementToSet.css("position", "relative");
        newPost.find(".prev-button").css("display", "none");
        newPost.find(".next-button").css("display", "none");
      } else {
        const urls = post.post_content_url; // urls: string[]
        const imageEl = newPost.find(".post-image").first();
        imageEl.css({
          transition: transitionValue,
          transform: `translateX(0%)`,
        });
        imageEl.attr("src", urls[0]);
        newPost.find(".image-placeholder").attr("src", urls[0]);
        for (let i = 1; i < urls.length; i++) {
          const newImageEl = imageEl.clone();
          newImageEl.attr("src", urls[i]);
          newImageEl.css({
            transition: transitionValue,
            transform: `translateX(100%)`,
          });
          carouselEl.append(newImageEl);
        }
        newPost.find(".prev-button").on("click", prevSlide(carouselEl, postIndex, urls.length - 1));
        newPost.find(".next-button").on("click", nextSlide(carouselEl, postIndex, urls.length - 1));
      }

      newPost.find(".ph-account-name").each((index, el) => {
        el.innerHTML = post.account_name;
      })

      newPost.find(".ph-account-likes-it").html(post.account_likes_it);

      post.post_text = post.post_text.replace(/(\B(\#[a-zA-Zàèéòù]+\b)(?!;))/g, "<hashtag>$1</hashtag>");
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