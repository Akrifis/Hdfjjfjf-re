// Конфигурация
const CONFIG = {
    GITHUB_REPO: 'YOUR_GITHUB_USERNAME/YOUR_REPO_NAME',
    BRANCH: 'main',
    ANIME_LIST_FILE: 'anime_list.json',
    GITHUB_RAW_URL: 'https://raw.githubusercontent.com',
    UPDATE_CHECK_INTERVAL: 300000 // 5 минут
};

// Глобальные переменные
let animeList = [];
let currentAnime = null;
let currentEpisodeIndex = 0;
let currentCategory = 'all';
let lastUpdateCheck = Date.now();

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация гамбургер-меню
    initHamburgerMenu();
    
    // Инициализация категорий
    initCategories();
    
    // Определяем текущую страницу
    const isPlayerPage = window.location.pathname.includes('player.html');
    
    if (isPlayerPage) {
        initPlayerPage();
    } else {
        initMainPage();
    }
    
    // Запускаем периодическую проверку обновлений
    startUpdateChecker();
});

// Инициализация гамбургер-меню
function initHamburgerMenu() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', (event) => {
            event.stopPropagation();
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
            
            document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
        });
        
        const navLinks = navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
        
        document.addEventListener('click', (event) => {
            if (navMenu.classList.contains('active') && 
                !navMenu.contains(event.target) && 
                !hamburger.contains(event.target)) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
        
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && navMenu.classList.contains('active')) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
}

// Инициализация категорий
function initCategories() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Убираем активный класс у всех кнопок
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            // Добавляем активный класс нажатой кнопке
            button.classList.add('active');
            
            // Получаем категорию
            const category = button.dataset.category;
            currentCategory = category;
            
            // Показываем выбранную категорию
            showCategory(category);
        });
    });
}

// Главная страница
async function initMainPage() {
    // Загрузка списка аниме
    await loadAnimeList();
    
    // Кнопка повторной загрузки
    document.getElementById('retryBtn')?.addEventListener('click', loadAnimeList);
}

// Страница плеера
async function initPlayerPage() {
    const animeId = getUrlParameter('id');
    const episodeNum = parseInt(getUrlParameter('episode')) || 1;
    
    if (!animeId) {
        window.location.href = 'index.html';
        return;
    }
    
    await loadAnimeList();
    
    currentAnime = animeList.find(anime => anime.id == animeId);
    
    if (!currentAnime) {
        window.location.href = 'index.html';
        return;
    }
    
    currentEpisodeIndex = episodeNum - 1;
    
    updateAnimeInfo();
    loadKodikPlayer();
    initEpisodeControls();
    loadSimilarAnime();
    initUpdateHistory();
    initFavoriteButton();
}

// Загрузка списка аниме с GitHub
async function loadAnimeList() {
    const loadingElement = document.getElementById('loading');
    const errorElement = document.getElementById('errorMessage');
    const animeGrid = document.getElementById('animeGrid');
    
    if (loadingElement) loadingElement.style.display = 'block';
    if (errorElement) errorElement.style.display = 'none';
    if (animeGrid) animeGrid.innerHTML = '';
    
    try {
        const url = `${CONFIG.GITHUB_RAW_URL}/${CONFIG.GITHUB_REPO}/${CONFIG.BRANCH}/${CONFIG.ANIME_LIST_FILE}?t=${Date.now()}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Ошибка загрузки данных');
        }
        
        animeList = await response.json();
        
        if (!Array.isArray(animeList) || animeList.length === 0) {
            throw new Error('Список аниме пустой');
        }
        
        // Обновляем время последней проверки
        lastUpdateCheck = Date.now();
        
        // Отображаем аниме в зависимости от текущей категории
        if (animeGrid) {
            showCategory(currentCategory);
        } else {
            // Если мы на странице плеера, просто сохраняем список
            console.log('Список аниме загружен, всего:', animeList.length);
        }
        
        if (loadingElement) loadingElement.style.display = 'none';
        
    } catch (error) {
        console.error('Ошибка загрузки списка аниме:', error);
        
        if (loadingElement) loadingElement.style.display = 'none';
        if (errorElement) {
            errorElement.style.display = 'block';
        }
    }
}

// Показать категорию
function showCategory(category) {
    const animeGrid = document.getElementById('animeGrid');
    const categoryInfo = document.getElementById('categoryInfo');
    const categoryTitle = document.getElementById('categoryTitle');
    const categoryDescription = document.getElementById('categoryDescription');
    const emptyCategory = document.getElementById('emptyCategory');
    
    if (!animeGrid || !categoryInfo) return;
    
    // Фильтруем аниме по категории
    let filteredAnime = [];
    
    switch(category) {
        case 'upcoming':
            filteredAnime = animeList.filter(anime => anime.status === 'upcoming');
            categoryTitle.textContent = 'Анонсы';
            categoryDescription.textContent = 'Скоро выходящие аниме';
            break;
        case 'ongoing':
            filteredAnime = animeList.filter(anime => anime.status === 'ongoing');
            categoryTitle.textContent = 'Онгоинги';
            categoryDescription.textContent = 'Аниме, которые выходят сейчас';
            break;
        case 'completed':
            filteredAnime = animeList.filter(anime => anime.status === 'completed');
            categoryTitle.textContent = 'Завершенные';
            categoryDescription.textContent = 'Полностью вышедшие аниме';
            break;
        default:
            filteredAnime = animeList;
            categoryTitle.textContent = 'Все аниме';
            categoryDescription.textContent = 'Просмотр всех доступных аниме';
    }
    
    // Показываем/скрываем сообщение о пустой категории
    if (filteredAnime.length === 0) {
        animeGrid.style.display = 'none';
        emptyCategory.style.display = 'block';
    } else {
        animeGrid.style.display = 'grid';
        emptyCategory.style.display = 'none';
        renderAnimeList(filteredAnime);
    }
}

// Рендеринг списка аниме
function renderAnimeList(list) {
    const animeGrid = document.getElementById('animeGrid');
    if (!animeGrid) return;
    
    animeGrid.innerHTML = '';
    
    if (!list || list.length === 0) {
        animeGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-film"></i>
                <h3>Аниме не найдены</h3>
                <p>Попробуйте выбрать другую категорию</p>
            </div>
        `;
        return;
    }
    
    list.forEach(anime => {
        const animeCard = createAnimeCard(anime);
        animeGrid.appendChild(animeCard);
    });
}

// Создание карточки аниме
function createAnimeCard(anime) {
    const card = document.createElement('div');
    card.className = 'anime-card';
    card.dataset.id = anime.id;
    
    const posterUrl = anime.poster || 'https://via.placeholder.com/280x350/0f1e2d/ffffff?text=No+Image';
    const episodesData = anime.episodes_data || [];
    const availableEpisodes = episodesData.length;
    const totalEpisodes = anime.episodes || 0;
    
    // Определяем текст кнопки в зависимости от статуса
    let watchButton = '';
    if (anime.status === 'upcoming') {
        watchButton = '<button class="watch-btn disabled" disabled><i class="fas fa-clock"></i> Скоро</button>';
    } else if (availableEpisodes === 0) {
        watchButton = '<button class="watch-btn disabled" disabled><i class="fas fa-exclamation-circle"></i> Нет серий</button>';
    } else {
        watchButton = `<button class="watch-btn" onclick="window.location.href='player.html?id=${anime.id}'">
            <i class="fas fa-play"></i> Смотреть
        </button>`;
    }
    
    card.innerHTML = `
        <div class="anime-poster-container">
            <img src="${posterUrl}" alt="${anime.title}" class="anime-poster" 
                 onerror="this.src='https://via.placeholder.com/280x350/0f1e2d/ffffff?text=No+Image'">
            <div class="anime-overlay"></div>
            <div class="status-badge ${anime.status}">
                ${getStatusText(anime.status)}
            </div>
            ${availableEpisodes > 0 ? `<div class="episode-count">${availableEpisodes} серий</div>` : ''}
        </div>
        <div class="anime-content">
            <h3 class="anime-title">${anime.title}</h3>
            <div class="anime-meta">
                <span class="anime-rating">
                    <i class="fas fa-star"></i> ${anime.rating || 'Н/Д'}
                </span>
                <span class="anime-year">
                    <i class="fas fa-calendar"></i> ${anime.year || '?'}
                </span>
            </div>
            ${anime.genres ? `
                <div class="anime-genres">
                    ${anime.genres.slice(0, 3).map(genre => 
                        `<span class="anime-genre">${genre}</span>`
                    ).join('')}
                </div>
            ` : ''}
            
            ${availableEpisodes > 0 && totalEpisodes > 0 ? `
                <div class="episode-progress-card">
                    <div class="progress-text">
                        <span class="added">${availableEpisodes} добавлено</span>
                        <span class="total">из ${totalEpisodes}</span>
                    </div>
                    <div class="progress-bar-small">
                        <div class="progress-fill-small" style="width: ${(availableEpisodes / totalEpisodes) * 100}%"></div>
                    </div>
                </div>
            ` : ''}
            
            ${watchButton}
        </div>
    `;
    
    return card;
}

// Обновление информации об аниме на странице плеера
function updateAnimeInfo() {
    if (!currentAnime) return;
    
    document.title = `${currentAnime.title} - Re:Voice`;
    
    const playerTitle = document.getElementById('playerTitle');
    if (playerTitle) {
        playerTitle.textContent = currentAnime.title;
    }
    
    const posterUrl = currentAnime.poster || 'https://via.placeholder.com/280x350/0f1e2d/ffffff?text=No+Image';
    const episodesData = currentAnime.episodes_data || [];
    const availableEpisodes = episodesData.length;
    const totalEpisodes = currentAnime.episodes || 0;
    
    const elements = {
        'animeTitle': currentAnime.title,
        'animeDescription': currentAnime.description || 'Нет описания',
        'animeYear': currentAnime.year || 'Неизвестно',
        'animeRating': currentAnime.rating || '0.0',
        'animeEpisodes': totalEpisodes,
        'animeType': currentAnime.type || 'TV Сериал',
        'animePoster': posterUrl,
        'availableEpisodes': availableEpisodes,
        'totalEpisodes': totalEpisodes,
        'totalEpisodesCount': totalEpisodes,
        'totalEpisodesStat': totalEpisodes,
        'addedEpisodes': availableEpisodes
    };
    
    Object.keys(elements).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            if (id === 'animePoster') {
                element.src = elements[id];
                element.alt = currentAnime.title;
                element.onerror = function() {
                    this.src = 'https://via.placeholder.com/280x350/0f1e2d/ffffff?text=No+Image';
                };
            } else {
                element.textContent = elements[id];
            }
        }
    });
    
    // Обновляем прогресс бар
    const progressFill = document.getElementById('progressFill');
    if (progressFill && totalEpisodes > 0) {
        const progressPercent = (availableEpisodes / totalEpisodes) * 100;
        progressFill.style.width = `${progressPercent}%`;
    }
    
    // Обновляем статус
    const statusBadge = document.getElementById('statusBadge');
    const statusText = document.getElementById('statusText');
    if (statusBadge && statusText) {
        statusBadge.className = `anime-status-badge ${currentAnime.status}`;
        statusText.textContent = getStatusText(currentAnime.status);
    }
    
    // Обновляем жанры
    const genresList = document.getElementById('animeGenres');
    if (genresList && currentAnime.genres) {
        genresList.innerHTML = currentAnime.genres.map(genre => 
            `<span class="genre-tag">${genre}</span>`
        ).join('');
    }
}

// Загрузка плеера Kodik
function loadKodikPlayer() {
    if (!currentAnime) {
        console.error('Нет данных об аниме');
        return;
    }
    
    const player = document.getElementById('kodikPlayer');
    const placeholder = document.getElementById('playerPlaceholder');
    
    if (!player || !placeholder) return;
    
    const episodesData = currentAnime.episodes_data || [];
    
    if (episodesData.length === 0) {
        placeholder.innerHTML = `
            <div class="placeholder-content">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Серии не найдены</h3>
                <p>Для этого аниме не добавлены серии</p>
            </div>
        `;
        return;
    }
    
    const currentEpisode = episodesData[currentEpisodeIndex];
    
    if (!currentEpisode || !currentEpisode.kodik_link) {
        placeholder.innerHTML = `
            <div class="placeholder-content">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Ссылка на серию не найдена</h3>
                <p>Проверьте данные в anime_list.json</p>
            </div>
        `;
        return;
    }
    
    // Обновляем заголовок серии
    const episodeTitle = document.getElementById('currentEpisodeTitle');
    if (episodeTitle && currentEpisode.title) {
        episodeTitle.textContent = `Серия ${currentEpisode.number}: ${currentEpisode.title}`;
    }
    
    player.style.display = 'none';
    placeholder.style.display = 'flex';
    
    setTimeout(() => {
        player.src = currentEpisode.kodik_link;
        placeholder.style.display = 'none';
        player.style.display = 'block';
    }, 1500);
}

// Загрузка похожих аниме
function loadSimilarAnime() {
    if (!currentAnime || !animeList.length) return;
    
    const similarGrid = document.getElementById('similarAnime');
    if (!similarGrid) return;
    
    if (animeList.length <= 1) {
        similarGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-info-circle"></i>
                <p>Нет похожих аниме в списке</p>
            </div>
        `;
        return;
    }
    
    let similarAnime = animeList.filter(anime => anime.id !== currentAnime.id);
    
    // Сортируем по рейтингу и берем первые 4
    similarAnime.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    similarAnime = similarAnime.slice(0, 4);
    
    if (similarAnime.length === 0) {
        similarGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-info-circle"></i>
                <p>Нет похожих аниме в списке</p>
            </div>
        `;
        return;
    }
    
    similarGrid.innerHTML = '';
    similarAnime.forEach(anime => {
        const posterUrl = anime.poster || 'https://via.placeholder.com/200x300/0f1e2d/ffffff?text=No+Image';
        
        const similarCard = document.createElement('div');
        similarCard.className = 'anime-card';
        similarCard.style.cursor = 'pointer';
        similarCard.onclick = () => {
            window.location.href = `player.html?id=${anime.id}`;
        };
        similarCard.innerHTML = `
            <div class="status-badge ${anime.status}" style="top: 10px; left: 10px; font-size: 0.7rem;">
                ${getStatusText(anime.status)}
            </div>
            <img src="${posterUrl}" alt="${anime.title}" class="anime-poster"
                 onerror="this.src='https://via.placeholder.com/200x300/0f1e2d/ffffff?text=No+Image'">
            <div class="anime-content">
                <h4 class="anime-title">${anime.title}</h4>
                <div class="anime-meta">
                    <span class="anime-rating">
                        <i class="fas fa-star"></i> ${anime.rating || 'Н/Д'}
                    </span>
                </div>
            </div>
        `;
        similarGrid.appendChild(similarCard);
    });
}

// Инициализация управления сериями
function initEpisodeControls() {
    const prevBtn = document.getElementById('prevEpisode');
    const nextBtn = document.getElementById('nextEpisode');
    const currentEpisodeNumber = document.getElementById('currentEpisodeNumber');
    const episodeList = document.getElementById('episodeList');
    
    if (!currentAnime) return;
    
    const episodesData = currentAnime.episodes_data || [];
    const totalEpisodes = currentAnime.episodes || 0;
    
    if (currentEpisodeNumber) {
        const currentEpisode = episodesData[currentEpisodeIndex];
        currentEpisodeNumber.textContent = currentEpisode ? currentEpisode.number : currentEpisodeIndex + 1;
    }
    
    if (episodeList) {
        episodeList.innerHTML = '';
        
        if (episodesData.length === 0) {
            episodeList.innerHTML = `
                <div style="text-align: center; padding: 20px; color: var(--gray-color); grid-column: 1 / -1;">
                    <i class="fas fa-info-circle"></i>
                    <p>Серии не добавлены</p>
                </div>
            `;
            return;
        }
        
        // Создаем массив всех серий (от 1 до totalEpisodes)
        for (let i = 1; i <= totalEpisodes; i++) {
            const episodeData = episodesData.find(ep => ep.number === i);
            const isAvailable = !!episodeData;
            const isActive = currentEpisodeIndex === i - 1;
            
            const episodeItem = document.createElement('div');
            episodeItem.className = `episode-item ${isAvailable ? 'available' : 'unavailable'} ${isActive ? 'active' : ''}`;
            
            if (isAvailable) {
                episodeItem.innerHTML = `
                    <div class="episode-number">${i}</div>
                    ${episodeData.title ? `<div class="episode-title">${episodeData.title}</div>` : ''}
                `;
                
                episodeItem.addEventListener('click', () => {
                    const episodeIndex = episodesData.findIndex(ep => ep.number === i);
                    if (episodeIndex !== -1) {
                        currentEpisodeIndex = episodeIndex;
                        updateEpisodeNavigation();
                        updatePlayerEpisode(episodeIndex);
                    }
                });
            } else {
                episodeItem.innerHTML = `
                    <div class="episode-number">${i}</div>
                    <div class="episode-title">Не добавлена</div>
                `;
                episodeItem.style.cursor = 'not-allowed';
            }
            
            episodeList.appendChild(episodeItem);
        }
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentEpisodeIndex > 0) {
                currentEpisodeIndex--;
                updateEpisodeNavigation();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentEpisodeIndex < episodesData.length - 1) {
                currentEpisodeIndex++;
                updateEpisodeNavigation();
            }
        });
    }
    
    function updateEpisodeNavigation() {
        const currentEpisode = episodesData[currentEpisodeIndex];
        
        if (currentEpisodeNumber) {
            currentEpisodeNumber.textContent = currentEpisode.number;
        }
        
        const episodeTitle = document.getElementById('currentEpisodeTitle');
        if (episodeTitle && currentEpisode.title) {
            episodeTitle.textContent = `Серия ${currentEpisode.number}: ${currentEpisode.title}`;
        }
        
        // Обновляем активную серию в списке
        document.querySelectorAll('.episode-item').forEach((item, index) => {
            item.classList.remove('active');
            if (index === currentEpisode.number - 1) {
                item.classList.add('active');
            }
        });
        
        // Обновляем URL
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('episode', currentEpisode.number);
        window.history.replaceState({}, '', newUrl);
        
        // Обновляем плеер
        updatePlayerEpisode(currentEpisodeIndex);
    }
}

// Обновление серии в плеере
function updatePlayerEpisode(index) {
    if (!currentAnime) return;
    
    const episodesData = currentAnime.episodes_data || [];
    const episode = episodesData[index];
    
    if (!episode || !episode.kodik_link) {
        console.error('Ссылка на серию не найдена');
        return;
    }
    
    const player = document.getElementById('kodikPlayer');
    const placeholder = document.getElementById('playerPlaceholder');
    
    if (!player || !placeholder) return;
    
    player.style.display = 'none';
    placeholder.style.display = 'flex';
    
    setTimeout(() => {
        player.src = episode.kodik_link;
        placeholder.style.display = 'none';
        player.style.display = 'block';
    }, 1000);
}

// Инициализация истории обновлений
function initUpdateHistory() {
    if (!currentAnime) return;
    
    const updateHistory = document.getElementById('updateHistory');
    const lastUpdated = document.getElementById('lastUpdated');
    
    if (!updateHistory || !lastUpdated) return;
    
    const episodesData = currentAnime.episodes_data || [];
    
    if (episodesData.length === 0) {
        updateHistory.innerHTML = '<p>Нет данных об обновлениях</p>';
        lastUpdated.textContent = 'Последнее обновление: никогда';
        return;
    }
    
    // Сортируем серии по дате добавления (если есть дата) или по номеру
    const sortedEpisodes = [...episodesData].sort((a, b) => {
        if (a.added_date && b.added_date) {
            return new Date(b.added_date) - new Date(a.added_date);
        }
        return b.number - a.number;
    });
    
    // Берем последние 5 обновлений
    const recentUpdates = sortedEpisodes.slice(0, 5);
    
    updateHistory.innerHTML = recentUpdates.map(episode => `
        <div class="update-item">
            <div class="update-date">Серия ${episode.number} ${episode.added_date ? `- ${formatDate(episode.added_date)}` : ''}</div>
            <div class="update-text">${episode.title || 'Без названия'}</div>
        </div>
    `).join('');
    
    // Устанавливаем дату последнего обновления
    const lastEpisode = sortedEpisodes[0];
    if (lastEpisode && lastEpisode.added_date) {
        lastUpdated.textContent = `Последнее обновление: ${formatDate(lastEpisode.added_date)}`;
    } else {
        lastUpdated.textContent = `Добавлено серий: ${episodesData.length}`;
    }
}

// Инициализация кнопки "В избранное"
function initFavoriteButton() {
    const favoriteBtn = document.getElementById('favoriteBtn');
    if (!favoriteBtn) return;
    
    // Проверяем, есть ли аниме в избранном
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const isFavorite = favorites.includes(currentAnime.id);
    
    if (isFavorite) {
        favoriteBtn.innerHTML = '<i class="fas fa-heart"></i> В избранном';
        favoriteBtn.classList.add('favorited');
    }
    
    favoriteBtn.addEventListener('click', () => {
        let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        
        if (favorites.includes(currentAnime.id)) {
            // Удаляем из избранного
            favorites = favorites.filter(id => id !== currentAnime.id);
            favoriteBtn.innerHTML = '<i class="far fa-heart"></i> В избранное';
            favoriteBtn.classList.remove('favorited');
        } else {
            // Добавляем в избранное
            favorites.push(currentAnime.id);
            favoriteBtn.innerHTML = '<i class="fas fa-heart"></i> В избранном';
            favoriteBtn.classList.add('favorited');
        }
        
        localStorage.setItem('favorites', JSON.stringify(favorites));
    });
}

// Запуск проверки обновлений
function startUpdateChecker() {
    // Проверяем обновления каждые 5 минут
    setInterval(async () => {
        try {
            const url = `${CONFIG.GITHUB_RAW_URL}/${CONFIG.GITHUB_REPO}/${CONFIG.BRANCH}/${CONFIG.ANIME_LIST_FILE}?t=${Date.now()}`;
            const response = await fetch(url);
            
            if (response.ok) {
                const newAnimeList = await response.json();
                
                // Проверяем, изменился ли список
                if (JSON.stringify(newAnimeList) !== JSON.stringify(animeList)) {
                    console.log('Обнаружены обновления, обновляю список...');
                    animeList = newAnimeList;
                    
                    // Если мы на главной странице, обновляем отображение
                    if (!window.location.pathname.includes('player.html')) {
                        showCategory(currentCategory);
                    } else if (currentAnime) {
                        // Если на странице просмотра, обновляем информацию об текущем аниме
                        const updatedAnime = animeList.find(anime => anime.id === currentAnime.id);
                        if (updatedAnime) {
                            currentAnime = updatedAnime;
                            updateAnimeInfo();
                            initEpisodeControls();
                            initUpdateHistory();
                            
                            // Показываем уведомление об обновлении
                            showUpdateNotification();
                        }
                    }
                    
                    lastUpdateCheck = Date.now();
                }
            }
        } catch (error) {
            console.error('Ошибка при проверке обновлений:', error);
        }
    }, CONFIG.UPDATE_CHECK_INTERVAL);
}

// Показать уведомление об обновлении
function showUpdateNotification() {
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
        <i class="fas fa-sync-alt"></i>
        <span>Список аниме обновлен!</span>
        <button onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    // Добавляем стили для уведомления
    const style = document.createElement('style');
    style.textContent = `
        .update-notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--gradient-primary);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 10000;
            box-shadow: var(--shadow-primary);
            animation: slideIn 0.3s ease;
        }
        
        .update-notification i {
            font-size: 1.2rem;
        }
        
        .update-notification button {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 5px;
            margin-left: 10px;
        }
        
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    
    if (!document.querySelector('style[data-update-notification]')) {
        style.setAttribute('data-update-notification', 'true');
        document.head.appendChild(style);
    }
    
    // Автоматическое скрытие через 5 секунд
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Вспомогательные функции
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

function getStatusText(status) {
    const statusMap = {
        'upcoming': 'Анонс',
        'ongoing': 'Онгоинг',
        'completed': 'Завершен'
    };
    return statusMap[status] || status || 'Неизвестно';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function shareAnime() {
    if (navigator.share) {
        navigator.share({
            title: currentAnime?.title || 'Аниме',
            text: `Смотри это аниме на Re:Voice Anime`,
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(window.location.href)
            .then(() => {
                alert('Ссылка скопирована в буфер обмена!');
            })
            .catch(() => {
                prompt('Скопируйте ссылку:', window.location.href);
            });
    }
}

function reportIssue() {
    const issue = prompt('Опишите проблему с этой страницей:');
    if (issue) {
        alert('Спасибо за обратную связь! Мы рассмотрим проблему.');
        console.log('Сообщение об ошибке:', issue, 'URL:', window.location.href);
    }
}

function filterSimilar(type) {
    // Логика фильтрации похожих аниме
    const filterButtons = document.querySelectorAll('.similar-filter');
    filterButtons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Здесь можно реализовать разную логику фильтрации
    loadSimilarAnime(); // Пока просто перезагружаем
}

// Глобальные функции для меню
window.showCategory = showCategory;
window.shareAnime = shareAnime;
window.reportIssue = reportIssue;
window.filterSimilar = filterSimilar;
window.loadAnimeList = loadAnimeList;
