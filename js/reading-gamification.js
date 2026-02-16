(function (window, document) {
  'use strict';

  const STORAGE_KEY = 'pfy-gamification-v1';
  const MIN_COMPLETION_SECONDS = 45;
  const END_THRESHOLD = 0.95;

  function createDefaultState() {
    return {
      completedChapters: [],
      reactions: [],
      favorites: [],
      shares: [],
      readingTimeByChapter: [],
      badgesUnlocked: []
    };
  }

  function sanitizeState(rawState) {
    const fallback = createDefaultState();

    if (!rawState || typeof rawState !== 'object') {
      return fallback;
    }

    return {
      completedChapters: Array.isArray(rawState.completedChapters) ? rawState.completedChapters : fallback.completedChapters,
      reactions: Array.isArray(rawState.reactions) ? rawState.reactions : fallback.reactions,
      favorites: Array.isArray(rawState.favorites) ? rawState.favorites : fallback.favorites,
      shares: Array.isArray(rawState.shares) ? rawState.shares : fallback.shares,
      readingTimeByChapter: Array.isArray(rawState.readingTimeByChapter) ? rawState.readingTimeByChapter : fallback.readingTimeByChapter,
      badgesUnlocked: Array.isArray(rawState.badgesUnlocked) ? rawState.badgesUnlocked : fallback.badgesUnlocked
    };
  }

  function loadGamificationState() {
    try {
      const rawValue = window.localStorage.getItem(STORAGE_KEY);
      if (!rawValue) {
        return createDefaultState();
      }

      return sanitizeState(JSON.parse(rawValue));
    } catch (error) {
      return createDefaultState();
    }
  }

  function saveGamificationState(state) {
    const safeState = sanitizeState(state);

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(safeState));
      return true;
    } catch (error) {
      return false;
    }
  }

  function resetGamificationState() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      return false;
    }
  }

  function getReadingSeconds(state, chapterId) {
    const current = state.readingTimeByChapter.find(item => item.chapterId === chapterId);
    return current ? Number(current.seconds) || 0 : 0;
  }

  function withUniqueValue(values, value) {
    return values.includes(value) ? values : values.concat(value);
  }

  function registerEvent(type, payload) {
    const state = loadGamificationState();
    const nextState = sanitizeState(state);
    const ts = Date.now();

    if (type === 'chapter-completed' && payload?.chapterId) {
      nextState.completedChapters = withUniqueValue(nextState.completedChapters, payload.chapterId);
    }

    if (type === 'reaction' && payload?.chapterId && payload?.reactionType) {
      nextState.reactions = nextState.reactions
        .filter(item => !(item.chapterId === payload.chapterId && item.reactionType === payload.reactionType))
        .concat({ chapterId: payload.chapterId, reactionType: payload.reactionType, ts });
    }

    if (type === 'favorite' && payload?.chapterId) {
      nextState.favorites = withUniqueValue(nextState.favorites, payload.chapterId);
    }

    if (type === 'share' && payload?.chapterId && payload?.channel) {
      nextState.shares = nextState.shares.concat({ chapterId: payload.chapterId, channel: payload.channel, ts });
    }

    if (type === 'reading-time' && payload?.chapterId && typeof payload.seconds === 'number') {
      const currentSeconds = getReadingSeconds(nextState, payload.chapterId);
      const updated = nextState.readingTimeByChapter.filter(item => item.chapterId !== payload.chapterId);
      updated.push({ chapterId: payload.chapterId, seconds: Math.max(currentSeconds, payload.seconds) });
      nextState.readingTimeByChapter = updated;
    }

    nextState.badgesUnlocked = evaluateBadges(nextState);
    saveGamificationState(nextState);
    return nextState;
  }

  function evaluateBadges(state) {
    const badges = [];
    const totalReading = state.readingTimeByChapter.reduce((sum, item) => sum + (Number(item.seconds) || 0), 0);

    if (state.completedChapters.length >= 1) {
      badges.push('primer-capitulo');
    }

    if (state.completedChapters.length >= 5) {
      badges.push('lector-constante');
    }

    if (state.reactions.length >= 1) {
      badges.push('voz-del-lector');
    }

    if (state.favorites.length >= 1) {
      badges.push('coleccionista');
    }

    if (state.shares.length >= 1) {
      badges.push('embajador');
    }

    if (totalReading >= 1800) {
      badges.push('inmersion-total');
    }

    return badges;
  }

  function getChapterContext() {
    const path = window.location.pathname;
    const match = path.match(/\/books\/([^/]+)\/([^/]+)\.html$/);

    if (!match) {
      return null;
    }

    return {
      bookId: match[1],
      chapterId: match[2]
    };
  }

  function scopedChapterId(context) {
    return `${context.bookId}/${context.chapterId}`;
  }

  function ensureToast() {
    let toast = document.querySelector('[data-gamification-toast]');

    if (toast) {
      return toast;
    }

    toast = document.createElement('div');
    toast.setAttribute('data-gamification-toast', 'true');
    toast.setAttribute('aria-live', 'polite');
    toast.setAttribute('aria-atomic', 'true');
    toast.className = 'gamification-toast';
    toast.style.position = 'fixed';
    toast.style.right = '1rem';
    toast.style.bottom = '1rem';
    toast.style.maxWidth = 'min(28rem, calc(100vw - 2rem))';
    toast.style.background = '#1f1f28';
    toast.style.color = '#fff';
    toast.style.padding = '.75rem 1rem';
    toast.style.borderRadius = '.625rem';
    toast.style.boxShadow = '0 8px 20px rgba(0, 0, 0, .2)';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity .2s ease';
    toast.style.zIndex = '1200';
    document.body.appendChild(toast);

    return toast;
  }

  function bindActivation(element, callback) {
    element.addEventListener('click', callback);
    element.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        callback();
      }
    });
  }

  function showToast(message) {
    const toast = ensureToast();
    toast.textContent = message;
    toast.style.opacity = '1';

    window.clearTimeout(showToast.timeoutId);
    showToast.timeoutId = window.setTimeout(() => {
      toast.style.opacity = '0';
    }, 2400);
  }

  function wireReactions(context) {
    const buttons = Array.from(document.querySelectorAll('[data-gamification-reaction]'));

    buttons.forEach(button => {
      bindActivation(button, () => {
        const reactionType = button.dataset.gamificationReaction;
        if (!reactionType) {
          return;
        }

        registerEvent('reaction', {
          chapterId: scopedChapterId(context),
          reactionType
        });

        buttons.forEach(item => {
          const isActive = item === button;
          item.setAttribute('aria-pressed', isActive ? 'true' : 'false');
          item.classList.toggle('selected', isActive);
        });
        showToast('Reacción registrada. ¡Gracias por compartir lo que sentiste!');
      });
    });
  }

  function wireFavorite(context) {
    const button = document.querySelector('[data-gamification-favorite]');

    if (!button) {
      return;
    }

    const chapterKey = scopedChapterId(context);
    const state = loadGamificationState();
    const alreadyFavorite = state.favorites.includes(chapterKey);
    button.setAttribute('aria-pressed', alreadyFavorite ? 'true' : 'false');

    button.classList.toggle('selected', alreadyFavorite);

    bindActivation(button, () => {
      registerEvent('favorite', { chapterId: chapterKey });
      button.setAttribute('aria-pressed', 'true');
      button.classList.add('selected');
      showToast('Capítulo guardado en favoritos.');
    });
  }

  function wireShareTracking(context) {
    document.addEventListener('pfy:share', event => {
      const channel = event.detail?.channel;
      if (!channel) {
        return;
      }

      registerEvent('share', {
        chapterId: scopedChapterId(context),
        channel
      });
      showToast('¡Gracias por compartir este capítulo!');
    });
  }

  function wireReadingProgress(context) {
    const chapterKey = scopedChapterId(context);
    let elapsedSeconds = getReadingSeconds(loadGamificationState(), chapterKey);
    let completed = loadGamificationState().completedChapters.includes(chapterKey);

    const registerProgress = () => {
      registerEvent('reading-time', { chapterId: chapterKey, seconds: elapsedSeconds });
    };

    const tick = window.setInterval(() => {
      if (document.visibilityState !== 'visible') {
        return;
      }

      elapsedSeconds += 1;

      if (elapsedSeconds % 5 === 0) {
        registerProgress();
      }
    }, 1000);

    const onScroll = () => {
      const doc = document.documentElement;
      const maxScroll = doc.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;

      if (!completed && progress >= END_THRESHOLD && elapsedSeconds >= MIN_COMPLETION_SECONDS) {
        completed = true;
        const updatedState = registerEvent('chapter-completed', { chapterId: chapterKey });
        const unlockedNow = updatedState.badgesUnlocked;
        showToast(unlockedNow.includes('primer-capitulo') ? '¡Capítulo completado! Desbloqueaste una insignia.' : '¡Capítulo completado!');
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('beforeunload', () => {
      window.clearInterval(tick);
      registerProgress();
    });
  }

  function wireResetControl() {
    const resetButton = document.querySelector('[data-gamification-reset]');

    if (!resetButton) {
      return;
    }

    bindActivation(resetButton, () => {
      const shouldReset = window.confirm('Se restablecerán solo tus medallas y progreso de lectura en este navegador.');
      if (!shouldReset) {
        return;
      }

      const didReset = resetGamificationState();
      if (!didReset) {
        showToast('No pudimos restablecer el progreso. Intenta de nuevo.');
        return;
      }

      document.querySelectorAll('[data-gamification-reaction], [data-gamification-favorite]').forEach(item => {
        item.setAttribute('aria-pressed', 'false');
        item.classList.remove('selected');
      });

      const helper = resetButton.closest('details');
      if (helper) {
        helper.open = false;
      }

      showToast('Progreso restablecido en este navegador.');
    });
  }

  function init() {
    const context = getChapterContext();

    if (!context) {
      return;
    }

    wireReactions(context);
    wireFavorite(context);
    wireShareTracking(context);
    wireReadingProgress(context);
    wireResetControl();
  }

  window.ReadingGamification = {
    loadGamificationState,
    saveGamificationState,
    resetGamificationState,
    registerEvent,
    evaluateBadges,
    init
  };

  document.addEventListener('DOMContentLoaded', init);
})(window, document);
