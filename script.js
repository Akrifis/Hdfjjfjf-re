// Конфигурация
const CONFIG = {
    GITHUB_REPO: 'Akrifis/Hdfjjfjf-re',
    BRANCH: 'main',
    ANIME_LIST_FILE: 'anime_list.json',
    GITHUB_RAW_URL: 'https://raw.githubusercontent.com'
};

// Глобальные переменные
let animeList = [];
let currentAnime = null;
let currentFilter = 'all';
let currentSort = 'new';

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация гамбургер-меню
    initHamburgerMenu();
    
    // Определяем текущую страницу
    const isPlayerPage = window.location.pathname.includes('player.html');
    
    if (isPlayerPage) {
        initPlayerPage();
    } else {
        initMainPage();
    }
});

// Инициализация гамбургер-меню
function initHamburgerMenu() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
            
            // Блокировка скролла при открытом меню
            document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
        });
        
        // Закрытие меню при клике на ссылку
        const navLinks = navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
        
        // Закрытие меню при клике вне его
        document.addEventListener('click', (event) => {
            if (!hamburger.contains(event.target) && !navMenu.contains(event.target)) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
}

// Главная страница
async function initMainPage() {
    // Загрузка списка аниме
    await loadAnimeList();
    
    // Инициализация поиска
    initSearch();
    
    // Инициализация фильтров
    initFilters();
    
    // Инициализация сортировки
    initSorting();
    
    // Кнопка повторной загрузки
    document.getElementById('retryBtn')?.addEventListener('click', loadAnimeList);
}

// Страница плеера
async function initPlayerPage() {
    const animeId = getUrlParameter('id');
    
    if (!animeId) {
        window.location.href = 'index.html';
        return;
    }
    
    await loadAnimeList();
    
    // Находим аниме по ID
    currentAnime = animeList.find(anime => anime.id == animeId);
    
    if (!currentAnime) {
        window.location.href = 'index.html';
        return;
    }
    
    // Заполняем информацию об аниме
    updateAnimeInfo();
    
    // Загружаем плеер
    loadKodikPlayer();
    
    // Инициализируем управление сериями
    initEpisodeControls();
    
    // Загружаем похожие аниме
    loadSimilarAnime();
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
        const url = `${CONFIG.GITHUB_RAW_URL}/${CONFIG.GITHUB_REPO}/${CONFIG.BRANCH}/${CONFIG.ANIME_LIST_FILE}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Ошибка загрузки данных');
        }
        
        animeList = await response.json();
        
        // Проверяем, что список аниме не пустой
        if (!Array.isArray(animeList) || animeList.length === 0) {
            throw new Error('Список аниме пустой');
        }
        
        // Применяем текущие фильтры и сортировку
        applyFiltersAndSort();
        
        if (loadingElement) loadingElement.style.display = 'none';
        
    } catch (error) {
        console.error('Ошибка загрузки списка аниме:', error);
        
        if (loadingElement) loadingElement.style.display = 'none';
        if (errorElement) {
            errorElement.style.display = 'block';
        }
    }
}

// Применение фильтров и сортировки
function applyFiltersAndSort() {
    let filteredList = [...animeList];
    
    // Применяем фильтр
    if (currentFilter === 'ongoing') {
        filteredList = filteredList.filter(anime => 
            anime.status && anime.status.toLowerCase() === 'ongoing'
        );
    } else if (currentFilter === 'completed') {
        filteredList = filteredList.filter(anime => 
            anime.status && anime.status.toLowerCase() === 'completed'
        );
    }
    
    // Применяем сортировку
    switch (currentSort) {
        case 'new':
            filteredList.sort((a, b) => (b.year || 0) - (a.year || 0));
            break;
        case 'rating':
            filteredList.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;
        case 'name':
            filteredList.sort((a, b) => {
                const titleA = a.title || '';
                const titleB = b.title || '';
                return titleA.localeCompare(titleB, 'ru');
            });
            break;
    }
    
    // Отображаем отфильтрованный список
    renderAnimeList(filteredList);
}

// Рендеринг списка аниме
function renderAnimeList(list) {
    const animeGrid = document.getElementById('animeGrid');
    if (!animeGrid) return;
    
    // Очищаем контейнер
    animeGrid.innerHTML = '';
    
    // Если список пустой, показываем сообщение
    if (!list || list.length === 0) {
        animeGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-film"></i>
                <h3>Аниме не найдены</h3>
                <p>Попробуйте изменить фильтры или поисковый запрос</p>
            </div>
        `;
        return;
    }
    
    // Рендерим карточки аниме
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
    
    // Используем изображение-заглушку, если постер не указан
    const posterUrl = anime.poster || 'https://via.placeholder.com/280x350/0f1e2d/ffffff?text=No+Image';
    
    // Определяем бейдж
    const badge = getAnimeBadge(anime);
    
    card.innerHTML = `
        <div class="anime-poster-container">
            <img src="${posterUrl}" alt="${anime.title}" class="anime-poster" 
                 onerror="this.src='https://via.placeholder.com/280x350/0f1e2d/ffffff?text=No+Image'">
            <div class="anime-overlay"></div>
            ${badge ? `<div class="anime-badge">${badge}</div>` : ''}
        </div>
        <div class="anime-content">
            <h3 class="anime-title">${anime.title}</h3>
            <div class="anime-meta">
                <span class="anime-rating">
                    <i class="fas fa-star"></i> ${anime.rating || 'Н/Д'}
                </span>
                <span class="anime-status ${anime.status?.toLowerCase() || 'ongoing'}">
                    ${getStatusText(anime.status)}
                </span>
            </div>
            ${anime.genres ? `
                <div class="anime-genres">
                    ${anime.genres.slice(0, 3).map(genre => 
                        `<span class="anime-genre">${genre}</span>`
                    ).join('')}
                </div>
            ` : ''}
            <p class="anime-description">${anime.description || 'Нет описания'}</p>
            <button class="watch-btn" onclick="window.location.href='player.html?id=${anime.id}'">
                <i class="fas fa-play"></i> Смотреть
            </button>
        </div>
    `;
    
    return card;
}

// Обновление информации об аниме на странице плеера
function updateAnimeInfo() {
    if (!currentAnime) return;
    
    // Обновляем заголовок страницы
    document.title = `${currentAnime.title} - Re:Voice`;
    
    // Обновляем заголовок плеера
    const playerTitle = document.getElementById('playerTitle');
    if (playerTitle) {
        playerTitle.textContent = currentAnime.title;
    }
    
    // Используем изображение-заглушку, если постер не указан
    const posterUrl = currentAnime.poster || 'https://via.placeholder.com/280x350/0f1e2d/ffffff?text=No+Image';
    
    // Обновляем элементы на странице
    const elements = {
        'animeTitle': currentAnime.title,
        'animeDescription': currentAnime.description || 'Нет описания',
        'animeYear': currentAnime.year || 'Неизвестно',
        'animeRating': currentAnime.rating || '0.0',
        'animeEpisodes': currentAnime.episodes || '?',
        'animePoster': posterUrl
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
    
    // Сначала показываем placeholder
    player.style.display = 'none';
    placeholder.style.display = 'flex';
    
    // Если есть ссылка на Kodik, загружаем плеер
    if (currentAnime.kodik_link) {
        setTimeout(() => {
            player.src = currentAnime.kodik_link;
            placeholder.style.display = 'none';
            player.style.display = 'block';
        }, 1500);
    } else {
        // Если ссылки нет, показываем сообщение
        placeholder.innerHTML = `
            <div class="placeholder-content">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Плеер недоступен</h3>
                <p>Ссылка на плеер не указана</p>
            </div>
        `;
    }
}

// Загрузка похожих аниме
function loadSimilarAnime() {
    if (!currentAnime || !animeList.length) return;
    
    const similarGrid = document.getElementById('similarAnime');
    if (!similarGrid) return;
    
    // Фильтруем аниме по жанрам (если есть)
    const currentGenres = currentAnime.genres || [];
    let similarAnime = [];
    
    if (currentGenres.length > 0) {
        similarAnime = animeList.filter(anime => {
            if (anime.id === currentAnime.id) return false;
            
            const animeGenres = anime.genres || [];
            return animeGenres.some(genre => currentGenres.includes(genre));
        }).slice(0, 4);
    }
    
    // Если не нашли по жанрам, берем случайные аниме
    if (similarAnime.length < 4) {
        const randomAnime = animeList
            .filter(anime => anime.id !== currentAnime.id)
            .sort(() => Math.random() - 0.5)
            .slice(0, 4 - similarAnime.length);
        
        similarAnime = [...similarAnime, ...randomAnime];
    }
    
    // Если нет похожих аниме
    if (similarAnime.length === 0) {
        similarGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-info-circle"></i>
                <p>Нет похожих аниме в списке</p>
            </div>
        `;
        return;
    }
    
    // Рендерим похожие аниме
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

// Инициализация фильтров
function initFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn[data-filter]');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Убираем активный класс у всех кнопок фильтров
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            // Добавляем активный класс нажатой кнопке
            this.classList.add('active');
            
            // Обновляем текущий фильтр
            currentFilter = this.dataset.filter;
            
            // Применяем фильтры и сортировку
            applyFiltersAndSort();
        });
    });
}

// Инициализация сортировки
function initSorting() {
    const sortButtons = document.querySelectorAll('.sort-btn[data-sort]');
    
    sortButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Убираем активный класс у всех кнопок сортировки
            document.querySelectorAll('.sort-btn').forEach(btn => btn.classList.remove('active'));
            // Добавляем активный класс нажатой кнопке
            this.classList.add('active');
            
            // Обновляем текущую сортировку
            currentSort = this.dataset.sort;
            
            // Применяем фильтры и сортировку
            applyFiltersAndSort();
        });
    });
}

// Инициализация поиска
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    let searchTimeout;
    
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        
        searchTimeout = setTimeout(() => {
            const searchTerm = this.value.toLowerCase().trim();
            
            if (searchTerm.length === 0) {
                applyFiltersAndSort();
                return;
            }
            
            const filtered = animeList.filter(anime => {
                // Поиск по названию
                if (anime.title && anime.title.toLowerCase().includes(searchTerm)) {
                    return true;
                }
                
                // Поиск по описанию
                if (anime.description && anime.description.toLowerCase().includes(searchTerm)) {
                    return true;
                }
                
                // Поиск по жанрам
                if (anime.genres && Array.isArray(anime.genres)) {
                    return animeGenres.some(genre => 
                        genre.toLowerCase().includes(searchTerm)
                    );
                }
                
                return false;
            });
            
            renderAnimeList(filtered);
        }, 300);
    });
}

// Инициализация управления сериями
function initEpisodeControls() {
    const prevBtn = document.getElementById('prevEpisode');
    const nextBtn = document.getElementById('nextEpisode');
    const currentEpisode = document.getElementById('currentEpisode');
    const totalEpisodes = document.getElementById('totalEpisodes');
    const episodeList = document.getElementById('episodeList');
    
    if (!currentAnime) return;
    
    const episodes = currentAnime.episodes || 1;
    let currentEpisodeNum = parseInt(getUrlParameter('episode')) || 1;
    
    // Обновляем информацию о сериях
    if (totalEpisodes) {
        totalEpisodes.textContent = `Всего: ${episodes} серий`;
    }
    
    if (currentEpisode) {
        currentEpisode.textContent = currentEpisodeNum;
    }
    
    // Создаем список серий
    if (episodeList) {
        episodeList.innerHTML = '';
        for (let i = 1; i <= episodes; i++) {
            const episodeItem = document.createElement('div');
            episodeItem.className = `episode-item ${i === currentEpisodeNum ? 'active' : ''}`;
            episodeItem.textContent = i;
            episodeItem.addEventListener('click', () => {
                // Обновляем текущую серию
                currentEpisodeNum = i;
                currentEpisode.textContent = i;
                
                // Обновляем активный элемент
                document.querySelectorAll('.episode-item').forEach(item => {
                    item.classList.remove('active');
                });
                episodeItem.classList.add('active');
                
                // Обновляем URL
                const newUrl = new URL(window.location);
                newUrl.searchParams.set('episode', i);
                window.history.replaceState({}, '', newUrl);
                
                // Обновляем плеер
                updatePlayerEpisode(i);
            });
            episodeList.appendChild(episodeItem);
        }
    }
    
    // Обработчики для кнопок навигации
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentEpisodeNum > 1) {
                currentEpisodeNum--;
                updateEpisodeNavigation();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentEpisodeNum < episodes) {
                currentEpisodeNum++;
                updateEpisodeNavigation();
            }
        });
    }
    
    function updateEpisodeNavigation() {
        // Обновляем отображение текущей серии
        if (currentEpisode) {
            currentEpisode.textContent = currentEpisodeNum;
        }
        
        // Обновляем активный элемент в списке
        document.querySelectorAll('.episode-item').forEach((item, index) => {
            item.classList.toggle('active', index + 1 === currentEpisodeNum);
        });
        
        // Обновляем URL
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('episode', currentEpisodeNum);
        window.history.replaceState({}, '', newUrl);
        
        // Обновляем плеер
        updatePlayerEpisode(currentEpisodeNum);
    }
}

// Обновление серии в плеере
function updatePlayerEpisode(episode) {
    if (!currentAnime) return;
    
    console.log(`Переключение на серию ${episode}`);
    
    // Если у аниме есть отдельные ссылки для каждой серии
    if (currentAnime.episode_links && currentAnime.episode_links[episode - 1]) {
        const player = document.getElementById('kodikPlayer');
        if (player) {
            player.src = currentAnime.episode_links[episode - 1];
        }
    }
}

// Вспомогательные функции
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

function getStatusText(status) {
    if (!status) return 'Неизвестно';
    
    const statusMap = {
        'ongoing': 'Онгоинг',
        'completed': 'Завершен',
        'upcoming': 'Анонсирован',
        'онгоинг': 'Онгоинг',
        'завершен': 'Завершен',
        'анонсирован': 'Анонсирован'
    };
    
    return statusMap[status.toLowerCase()] || status;
}

function getAnimeBadge(anime) {
    if (anime.status === 'ongoing') return 'Онгоинг';
    if (anime.rating >= 8.5) return 'Топ';
    if (anime.year >= new Date().getFullYear() - 1) return 'Новинка';
    return null;
}

// Функция для кнопки "Поделиться"
function shareAnime() {
    if (navigator.share) {
        navigator.share({
            title: currentAnime.title,
            text: `Смотри "${currentAnime.title}" на Re:Voice Anime`,
            url: window.location.href
        });
    } else {
        // Копирование ссылки в буфер обмена
        navigator.clipboard.writeText(window.location.href)
            .then(() => {
                alert('Ссылка скопирована в буфер обмена!');
            })
            .catch(() => {
                prompt('Скопируйте ссылку:', window.location.href);
            });
    }
}

// Экспортируем функции для использования в консоли
window.loadAnimeList = loadAnimeList;
window.shareAnime = shareAnime;
