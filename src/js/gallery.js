import Swiper from "swiper";
import { FreeMode, Zoom } from "swiper/modules";

import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/zoom";

(() => {
    const mainImg = document.getElementById("mainPlanImg");
    if (!mainImg) return;

    const thumbs = Array.from(document.querySelectorAll(".thumb"));
    if (!thumbs.length) return;

    const btnThumbPrev = document.querySelector(".gallery-arrow.prev");
    const btnThumbNext = document.querySelector(".gallery-arrow.next");
    const btnMainPrev = document.querySelector(".main-arrow.prev");
    const btnMainNext = document.querySelector(".main-arrow.next");

    const zoomOverlay = document.getElementById("zoomOverlay");
    const zoomContainer = zoomOverlay?.querySelector(".zoom-container");
    const zoomImage = document.getElementById("zoomImage");
    const zoomClose = zoomOverlay?.querySelector(".zoom-close");
    const zoomPrev = zoomOverlay?.querySelector(".zoom-arrow.prev");
    const zoomNext = zoomOverlay?.querySelector(".zoom-arrow.next");
    const zoomBtn = document.querySelector(".zoom-btn");
    const zoomInBtn = document.querySelector(".zoom-in");
    const zoomOutBtn = document.querySelector(".zoom-out");
    const zoomResetBtn = document.querySelector(".zoom-reset");

    let activeIndex = thumbs.findIndex(t => t.classList.contains("is-active"));
    if (activeIndex < 0) activeIndex = 0;

    let pendingIndex = null;
    let isFading = false;

    let currentScale = 1;

    const MIN_SCALE = 1;
    const MAX_SCALE = 5;

    let lastTapTime = 0;
    let lastTapX = 0;
    let lastTapY = 0;
    const DOUBLE_TAP_DELAY = 300;
    const DOUBLE_TAP_DISTANCE = 30;

    let zoomSwipeStartX = 0;
    let zoomSwipeStartY = 0;
    let zoomSwipeTracking = false;
    const ZOOM_SWIPE_THRESHOLD = 40;
    const ZOOM_SWIPE_LOCK_AXIS_THRESHOLD = 10;
    let zoomSwipeAxis = null;
    let dragDistX = 0;
    let dragDistY = 0;

    let isPinching = false;
    let pinchStartDist = 0;
    let pinchStartScale = 1;
    let pinchCenterX = 0;
    let pinchCenterY = 0;

    const preloadedSet = new Set();

    let zoomSwiper = null;

    function preloadImage(src) {
        if (!src || preloadedSet.has(src)) return;
        preloadedSet.add(src);

        const img = new Image();
        img.src = src;
    }

    function preloadNeighbors(index) {
        const neighbors = [index - 1, index + 1];
        neighbors.forEach(i => {
            const thumb = thumbs[i];
            if (!thumb) return;
            preloadImage(thumb.dataset.full);
            preloadImage(thumb.dataset.large);
        });
    }

    function scheduleBackgroundPreload(currentIndex) {
        const toLoad = [];
        thumbs.forEach((thumb, i) => {
            if (i === currentIndex || i === currentIndex - 1 || i === currentIndex + 1) return;
            const large = thumb.dataset.large;
            const full = thumb.dataset.full;
            if (large) toLoad.push(large);
            if (full) toLoad.push(full);
        });

        function loadNext(items, idx) {
            if (idx >= items.length) return;


            const rIC = window.requestIdleCallback || ((cb) => setTimeout(() => cb({ timeRemaining: () => 50 }), 1));

            rIC((deadline) => {
                let current = idx;
                while (current < items.length && deadline.timeRemaining() > 1) {
                    preloadImage(items[current]);
                    current++;
                }
                if (current < items.length) {
                    loadNext(items, current);
                }
            }, { timeout: 2000 });
        }

        loadNext(toLoad, 0);
    }

    const swiper = new Swiper(".gallery-strip.swiper", {
        modules: [FreeMode],
        slidesPerView: 4,
        spaceBetween: 12,
        speed: 400,
        grabCursor: true,
        freeMode: {
            enabled: true,
            sticky: false,
            momentum: true,
        },
        breakpoints: {
            0: { slidesPerView: 2.5 },
            768: { slidesPerView: 5 },
        },
        on: {
            slideChange: updateThumbArrows
        }
    });

    function setActiveThumb(index) {
        thumbs.forEach(t => t.classList.remove("is-active"));
        thumbs[index]?.classList.add("is-active");
    }

    function updateThumbArrows() {
        if (btnThumbPrev) btnThumbPrev.disabled = swiper.isBeginning;
        if (btnThumbNext) btnThumbNext.disabled = swiper.isEnd;
    }

    function isZoomOpen() {
        return !!zoomOverlay && zoomOverlay.classList.contains("is-open");
    }

    function updateZoomButtons() {
        if (!zoomInBtn || !zoomOutBtn || !zoomResetBtn) return;

        if (currentScale > 1) {
            zoomResetBtn.classList.remove("at-limit");
            zoomResetBtn.disabled = false;
        } else {
            zoomResetBtn.classList.add("at-limit");
            zoomResetBtn.disabled = true;
        }

        if (currentScale >= MAX_SCALE) {
            zoomInBtn.classList.add("at-limit");
            zoomInBtn.disabled = true;
        } else {
            zoomInBtn.classList.remove("at-limit");
            zoomInBtn.disabled = false;
        }

        if (currentScale <= MIN_SCALE) {
            zoomOutBtn.classList.add("at-limit");
            zoomOutBtn.disabled = true;
        } else {
            zoomOutBtn.classList.remove("at-limit");
            zoomOutBtn.disabled = false;
        }
    }



    function setSwiperZoom(newScale, transitionDuration = 300) {
        if (!zoomSwiper || !zoomSwiper.zoom) return;

        currentScale = Math.min(Math.max(MIN_SCALE, newScale), MAX_SCALE);

        if (currentScale === 1) {
            zoomSwiper.zoom.out();
        } else {

            zoomSwiper.zoom.in(currentScale);
        }

        updateZoomButtons();
    }

    function resetZoomTransform() {
        currentScale = 1;
        if (zoomSwiper && zoomSwiper.zoom) {
            zoomSwiper.zoom.out();
        }
        updateZoomButtons();
    }

    function initZoomSwiper() {
        if (!zoomContainer || !zoomImage) return;

        if (zoomSwiper) {
            zoomSwiper.destroy(true, true);
            zoomSwiper = null;
        }

        let swiperWrapper = zoomContainer.querySelector('.swiper-wrapper');
        let swiperSlide = zoomContainer.querySelector('.swiper-slide');

        if (!swiperWrapper) {
            swiperWrapper = document.createElement('div');
            swiperWrapper.className = 'swiper-wrapper';
            zoomContainer.appendChild(swiperWrapper);
        }

        if (!swiperSlide) {
            swiperSlide = document.createElement('div');
            swiperSlide.className = 'swiper-slide';
        }

        if (swiperSlide.parentElement !== swiperWrapper) {
            swiperWrapper.appendChild(swiperSlide);
        }
        let zoomImgContainer = swiperSlide.querySelector('.swiper-zoom-container');
        if (!zoomImgContainer) {
            zoomImgContainer = document.createElement('div');
            zoomImgContainer.className = 'swiper-zoom-container';
            swiperSlide.appendChild(zoomImgContainer);
        }

        if (zoomImage.parentElement !== zoomImgContainer) {
            zoomImgContainer.appendChild(zoomImage);
        }
        if (!zoomContainer.classList.contains('swiper')) {
            zoomContainer.classList.add('swiper');
        }

        zoomSwiper = new Swiper(zoomContainer, {
            modules: [Zoom],
            zoom: {
                maxRatio: MAX_SCALE,
                minRatio: MIN_SCALE,
                toggle: true,
            },
            allowTouchMove: true,
            on: {
                zoomChange: (swiper, scale) => {
                    currentScale = scale;
                    updateZoomButtons();


                },
                touchStart: (swiper, e) => {
                    handleZoomTouchStart(e);
                },
                touchMove: (swiper, e) => {
                    handleZoomTouchMove(e);
                },
                touchEnd: (swiper, e) => {
                    handleZoomTouchEnd(e);
                }
            }
        });

        currentScale = 1;
        updateZoomButtons();
    }

    function openZoom() {
        if (!zoomOverlay || !zoomImage) return;
        const largeSrc = thumbs[activeIndex]?.dataset.large || mainImg.dataset.large || mainImg.src;
        zoomImage.src = largeSrc;
        zoomOverlay.classList.add("is-open");
        zoomOverlay.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";

        setTimeout(() => {
            initZoomSwiper();
        }, 50);
    }

    function closeZoom() {
        if (!zoomOverlay) return;
        zoomOverlay.classList.remove("is-open");
        zoomOverlay.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";

        resetZoomTransform();

        if (zoomSwiper) {
            zoomSwiper.destroy(true, true);
            zoomSwiper = null;
        }

        currentScale = 1;
        updateZoomButtons();
    }

    function applyImage(index) {
        const prevIndex = activeIndex;
        activeIndex = index;

        const fullSrc = thumbs[index]?.dataset.full || thumbs[index]?.src;
        if (!fullSrc) return;

        mainImg.src = fullSrc;
        mainImg.dataset.large = thumbs[index]?.dataset.large || fullSrc;

        if (isZoomOpen() && zoomImage) {
            const largeSrc = thumbs[index]?.dataset.large || fullSrc;
            zoomImage.src = largeSrc;


            resetZoomTransform();
        }

        setActiveThumb(index);
        preloadNeighbors(index);

        const isLoopJump = (prevIndex === thumbs.length - 1 && index === 0) || (prevIndex === 0 && index === thumbs.length - 1);
        isLoopJump ? swiper.slideTo(index, 0, false) : swiper.slideTo(index, 300);

        updateThumbArrows();
    }

    function requestSwitch(index) {
        const normalized = (index + thumbs.length) % thumbs.length;
        pendingIndex = normalized;
        if (isFading) return;
        isFading = true;
        mainImg.classList.add("is-fading");

        setTimeout(() => {
            const nextIndex = pendingIndex;
            pendingIndex = null;
            applyImage(nextIndex);
            requestAnimationFrame(() => {
                mainImg.classList.remove("is-fading");
                isFading = false;
                if (pendingIndex !== null) requestSwitch(pendingIndex);
            });
        }, 10);
    }

    function handleZoomWheel(e) {
        if (!isZoomOpen() || !zoomSwiper) return;
        e.preventDefault();

        const delta = e.deltaY > 0 ? -0.3 : 0.3;
        const newScale = currentScale + delta;

        setSwiperZoom(newScale, 100);
    }

    function handleDoubleTap(clientX, clientY) {
        if (!zoomSwiper || !zoomImage) return;

        if (currentScale > 1) {
            resetZoomTransform();
        } else {

            setSwiperZoom(3, 300);
        }
    }

    function getPinchDist(touches) {
        return Math.hypot(
            touches[0].clientX - touches[1].clientX,
            touches[0].clientY - touches[1].clientY
        );
    }

    function getPinchCenter(touches) {
        return {
            x: (touches[0].clientX + touches[1].clientX) / 2,
            y: (touches[0].clientY + touches[1].clientY) / 2
        };
    }

    function handleZoomTouchStart(e) {

        const touches = e.touches || (e.originalEvent && e.originalEvent.touches);
        if (!touches || touches.length === 0) return;


        if (touches.length === 2) {
            isPinching = true;
            zoomSwipeTracking = false;

            pinchStartDist = getPinchDist(touches);
            pinchStartScale = currentScale;

            const center = getPinchCenter(touches);
            pinchCenterX = center.x;
            pinchCenterY = center.y;

            if (e.preventDefault) e.preventDefault();
            return;
        }

        if (touches.length > 2) return;


        const touch = touches[0];
        if (!touch) return;

        const clientX = touch.clientX;
        const clientY = touch.clientY;
        const now = Date.now();

        const timeDiff = now - lastTapTime;
        const distX = Math.abs(clientX - lastTapX);
        const distY = Math.abs(clientY - lastTapY);


        if (timeDiff < DOUBLE_TAP_DELAY && distX < DOUBLE_TAP_DISTANCE && distY < DOUBLE_TAP_DISTANCE) {
            lastTapTime = 0;
            if (e.preventDefault) e.preventDefault();
            handleDoubleTap(clientX, clientY);
            return;
        }

        lastTapTime = now;
        lastTapX = clientX;
        lastTapY = clientY;


        if (currentScale <= 1) {
            zoomSwipeStartX = clientX;
            zoomSwipeStartY = clientY;
            zoomSwipeTracking = true;
            zoomSwipeAxis = null;
            dragDistX = 0;
            dragDistY = 0;
        }
    }

    function handleZoomTouchMove(e) {

        const touches = e.touches || (e.originalEvent && e.originalEvent.touches);
        if (!touches) return;


        if (touches.length === 2 && isPinching) {
            if (e.preventDefault) e.preventDefault();

            const currentDist = getPinchDist(touches);
            const ratio = currentDist / pinchStartDist;
            const newScale = pinchStartScale * ratio;

            setSwiperZoom(newScale, 0);
            return;
        }

        if (touches.length > 1) return;


        if (currentScale <= 1 && zoomSwipeTracking) {
            const touch = touches[0];
            if (!touch) return;

            const clientX = touch.clientX;
            const clientY = touch.clientY;

            dragDistX = clientX - zoomSwipeStartX;
            dragDistY = clientY - zoomSwipeStartY;

            if (!zoomSwipeAxis) {
                if (Math.abs(dragDistX) > ZOOM_SWIPE_LOCK_AXIS_THRESHOLD || Math.abs(dragDistY) > ZOOM_SWIPE_LOCK_AXIS_THRESHOLD) {
                    zoomSwipeAxis = Math.abs(dragDistX) > Math.abs(dragDistY) ? 'x' : 'y';
                }
            }
        }


    }

    function handleZoomTouchEnd(e) {
        if (isPinching) {
            isPinching = false;
            if (e.preventDefault) e.preventDefault();
            return;
        }

        if (!zoomSwipeTracking) return;
        zoomSwipeTracking = false;


        if (currentScale <= 1 && zoomSwipeAxis === 'x' && Math.abs(dragDistX) >= ZOOM_SWIPE_THRESHOLD) {
            if (dragDistX < 0) {
                requestSwitch(activeIndex + 1);
            } else {
                requestSwitch(activeIndex - 1);
            }
        }

        dragDistX = 0;
        dragDistY = 0;
    }

    function zoomIn() {
        const newScale = Math.min(currentScale + 0.5, MAX_SCALE);
        setSwiperZoom(newScale);
    }

    function zoomOut() {
        const newScale = Math.max(currentScale - 0.5, MIN_SCALE);
        setSwiperZoom(newScale);
    }


    thumbs.forEach((thumb, i) => thumb.addEventListener("click", () => requestSwitch(i)));

    btnMainNext?.addEventListener("click", () => requestSwitch(activeIndex + 1));
    btnMainPrev?.addEventListener("click", () => requestSwitch(activeIndex - 1));

    btnThumbNext?.addEventListener("click", () => { swiper.slideNext(); updateThumbArrows(); });
    btnThumbPrev?.addEventListener("click", () => { swiper.slidePrev(); updateThumbArrows(); });

    zoomBtn?.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); openZoom(); });
    zoomClose?.addEventListener("click", closeZoom);

    zoomInBtn?.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); zoomIn(); });
    zoomOutBtn?.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); zoomOut(); });
    zoomResetBtn?.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); resetZoomTransform(); });

    let overlayPointerStart = { x: 0, y: 0 };
    const TAP_THRESHOLD = 10;

    zoomOverlay?.addEventListener("pointerdown", (e) => {
        overlayPointerStart = { x: e.clientX, y: e.clientY };
    });

    zoomOverlay?.addEventListener("pointerup", (e) => {
        const dx = Math.abs(e.clientX - overlayPointerStart.x);
        const dy = Math.abs(e.clientY - overlayPointerStart.y);


        if (dx < TAP_THRESHOLD && dy < TAP_THRESHOLD) {

            const target = e.target;
            const isButton = target.closest('.zoom-in, .zoom-out, .zoom-reset, .zoom-close, .zoom-arrow');
            const isImage = target === zoomImage || target.closest('.swiper-zoom-container img');

            if (!isButton && !isImage) {
                closeZoom();
            }
        }
    });

    zoomNext?.addEventListener("click", (e) => { e.stopPropagation(); requestSwitch(activeIndex + 1); });
    zoomPrev?.addEventListener("click", (e) => { e.stopPropagation(); requestSwitch(activeIndex - 1); });


    if (zoomContainer) {
        zoomContainer.addEventListener("wheel", handleZoomWheel, { passive: false });
    }


    let zoomTouchStartX = 0;
    let zoomTouchStartY = 0;
    let zoomTouchMoved = false;
    const ZOOM_TOUCH_THRESHOLD = 50;

    zoomOverlay?.addEventListener("touchstart", (e) => {
        if (e.touches.length !== 1) return;
        zoomTouchStartX = e.touches[0].clientX;
        zoomTouchStartY = e.touches[0].clientY;
        zoomTouchMoved = false;
    }, { passive: true });

    zoomOverlay?.addEventListener("touchmove", (e) => {
        zoomTouchMoved = true;
    }, { passive: true });

    zoomOverlay?.addEventListener("touchend", (e) => {
        if (!zoomTouchMoved) return;
        if (currentScale > 1) return;

        const touch = e.changedTouches[0];
        if (!touch) return;

        const dx = touch.clientX - zoomTouchStartX;
        const dy = touch.clientY - zoomTouchStartY;

        if (Math.abs(dx) > ZOOM_TOUCH_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
            if (dx < 0) {
                requestSwitch(activeIndex + 1);
            } else {
                requestSwitch(activeIndex - 1);
            }
        }
    }, { passive: true });

    document.addEventListener("keydown", (e) => {
        if (!isZoomOpen()) return;

        switch (e.key) {
            case "Escape":
                closeZoom();
                break;
            case "ArrowRight":
                requestSwitch(activeIndex + 1);
                break;
            case "ArrowLeft":
                requestSwitch(activeIndex - 1);
                break;
            case "+":
            case "=":
                zoomIn();
                break;
            case "-":
            case "_":
                zoomOut();
                break;
        }
    });

    window.addEventListener("resize", () => {
        if (isZoomOpen() && zoomSwiper) {
            zoomSwiper.update();
        }
    });

    let startX = 0;
    let isDragging = false;
    const SWIPE_THRESHOLD = 40;

    function onPointerDown(e) {
        isDragging = true;
        startX = e.clientX ?? (e.touches?.[0]?.clientX ?? 0);
    }

    function onPointerUp(e) {
        if (!isDragging) return;
        isDragging = false;
        const endX = e.clientX ?? (e.changedTouches?.[0]?.clientX ?? 0);
        const dx = endX - startX;

        if (Math.abs(dx) < SWIPE_THRESHOLD) return;
        if (dx < 0) requestSwitch(activeIndex + 1);
        else requestSwitch(activeIndex - 1);
    }

    mainImg.addEventListener("mousedown", onPointerDown);
    mainImg.addEventListener("mouseup", onPointerUp);
    mainImg.addEventListener("touchstart", onPointerDown, { passive: true });
    mainImg.addEventListener("touchend", onPointerUp);

    applyImage(activeIndex);
    updateThumbArrows();
    scheduleBackgroundPreload(activeIndex);
})();