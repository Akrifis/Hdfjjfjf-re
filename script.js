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
    
    // Инициализация кнопки "Наверх"
    initScrollTop();
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

// Инициализация кнопки "Наверх"
function initScrollTop() {
    const scrollTopBtn = document.getElementById('scrollTop');
    if (!scrollTopBtn) return;
    
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Показать/скрыть кнопку при скролле
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollTopBtn.style.opacity = '1';
            scrollTopBtn.style.visibility = 'visible';
            scrollTopBtn.style.transform = 'translateY(0)';
        } else {
            scrollTopBtn.style.opacity = '0';
            scrollTopBtn.style.visibility = 'hidden';
            scrollTopBtn.style.transform = 'translateY(10px)';
        }
    });
}

// Главная страница
async function initMainPage() {
    // Загрузка списка аниме
    await loadAnimeList();
    
    // Инициализация поиска
    initSearch();
    
    // Инициализация сортировки
    initSorting();
    
    // Инициализация фильтров
    initFilters();
    
    // Инициализация быстрых фильтров
    initQuickFilters();
    
    // Кнопка повторной загрузки
    document.getElementById('retryBtn')?.addEventListener('click', loadAnimeList);
    
    // Инициализация пагинации
    initPagination();
    
    // Инициализация переключения темы
    initThemeToggle();
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
        
        // Отображаем аниме на главной странице
        if (animeGrid) {
            renderAnimeList(animeList);
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
                <h3>Список аниме пуст</h3>
                <p>Добавьте аниме в файл anime_list.json в репозитории</p>
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
    
    // Создаем цветной градиент на основе рейтинга
    const rating = anime.rating || 7.0;
    const ratingColor = getRatingColor(rating);
    
    // Используем изображение-заглушку, если постер не указан
    const posterUrl = anime.poster || 'https://via.placeholder.com/280x350/1a1a2e/ffffff?text=No+Image';
    
    // Определяем бейдж
    const badge = getAnimeBadge(anime);
    
    card.innerHTML = `
        <div class="anime-poster-container">
            <img src="${posterUrl}" alt="${anime.title}" class="anime-poster">
            <div class="anime-overlay"></div>
            ${badge ? `<div class="anime-badge">${badge}</div>` : ''}
        </div>
        <div class="anime-content">
            <h3 class="anime-title">${anime.title}</h3>
            <div class="anime-meta">
                <span class="anime-rating" style="background: ${ratingColor}">
                    <i class="fas fa-star"></i> ${rating}
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
    
    // Используем изображение-заглушку, если постер не указан
    const posterUrl = currentAnime.poster || 'https://via.placeholder.com/280x350/1a1a2e/ffffff?text=No+Image';
    
    // Обновляем элементы на странице
    const elements = {
        'animeTitle': currentAnime.title,
        'animeDescription': currentAnime.description || 'Нет описания',
        'animeYear': currentAnime.year || 'Неизвестно',
        'animeRating': currentAnime.rating || 'Н/Д',
        'animeStatus': getStatusText(currentAnime.status),
        'animeVoice': currentAnime.voice || 'Re:Voice',
        'animeType': currentAnime.type || 'TV Сериал',
        'animeEpisodes': currentAnime.episodes || '?',
        'animeGenres': (currentAnime.genres || ['Неизвестно']).join(', ')
    };
    
    Object.keys(elements).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = elements[id];
            
            // Особый случай для изображения
            if (id === 'animePoster') {
                element.src = posterUrl;
                element.alt = currentAnime.title;
            }
        }
    });
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
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Плеер недоступен</h3>
            <p>Ссылка на плеер Kodik не указана</p>
        `;
    }
}

// Загрузка похожих аниме
function loadSimilarAnime() {
    if (!currentAnime || !animeList.length) return;
    
    const similarGrid = document.getElementById('similarAnime');
    if (!similarGrid) return;
    
    // Если в списке только одно аниме (текущее), не показываем похожие
    if (animeList.length <= 1) {
        similarGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-info-circle"></i>
                <p>Нет похожих аниме в списке</p>
            </div>
        `;
        return;
    }
    
    // Фильтруем аниме по жанрам (если есть)
    const currentGenres = currentAnime.genres || [];
    let similarAnime = [];
    
    if (currentGenres.length > 0) {
        similarAnime = animeList.filter(anime => {
            if (anime.id === currentAnime.id) return false;
            
            const animeGenres = anime.genres || [];
            return animeGenres.some(genre => currentGenres.includes(genre));
        }).slice(0, 6);
    }
    
    // Если не нашли по жанрам, берем случайные аниме
    if (similarAnime.length < 6) {
        const randomAnime = animeList
            .filter(anime => anime.id !== currentAnime.id)
            .sort(() => Math.random() - 0.5)
            .slice(0, 6 - similarAnime.length);
        
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
        const posterUrl = anime.poster || 'https://via.placeholder.com/200x300/1a1a2e/ffffff?text=No+Image';
        
        const similarCard = document.createElement('div');
        similarCard.className = 'anime-card';
        similarCard.style.cursor = 'pointer';
        similarCard.innerHTML = `
            <img src="${posterUrl}" alt="${anime.title}" class="anime-poster">
            <div class="anime-content">
                <h4 class="anime-title">${anime.title}</h4>
                <button class="watch-btn" onclick="window.location.href='player.html?id=${anime.id}'">
                    <i class="fas fa-play"></i> Смотреть
                </button>
            </div>
        `;
        similarGrid.appendChild(similarCard);
    });
}

// Управление сериями
function initEpisodeControls() {
    const episodeSelect = document.getElementById('episodeSelect');
    const prevBtn = document.getElementById('prevEpisode');
    const nextBtn = document.getElementById('nextEpisode');
    
    if (!episodeSelect) return;
    
    // Определяем количество серий
    const totalEpisodes = currentAnime?.episodes || 1;
    
    // Очищаем список серий
    episodeSelect.innerHTML = '';
    
    // Заполняем список серий
    for (let i = 1; i <= totalEpisodes; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `Серия ${i}`;
        episodeSelect.appendChild(option);
    }
    
    // Устанавливаем текущую серию из URL или первую
    const currentEpisode = parseInt(getUrlParameter('episode')) || 1;
    episodeSelect.value = currentEpisode;
    
    // Обработчики событий
    episodeSelect.addEventListener('change', function() {
        updatePlayerEpisode(this.value);
    });
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            const current = parseInt(episodeSelect.value);
            if (current > 1) {
                episodeSelect.value = current - 1;
                updatePlayerEpisode(episodeSelect.value);
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const current = parseInt(episodeSelect.value);
            if (current < totalEpisodes) {
                episodeSelect.value = current + 1;
                updatePlayerEpisode(episodeSelect.value);
            }
        });
    }
}

// Обновление серии в плеере
function updatePlayerEpisode(episode) {
    if (!currentAnime) return;
    
    // Обновляем URL страницы
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('episode', episode);
    window.history.replaceState({}, '', newUrl);
    
    // В реальном проекте здесь должна быть логика обновления плеера
    console.log(`Переключение на серию ${episode}`);
    
    // Если у аниме есть отдельные ссылки для каждой серии
    if (currentAnime.episode_links && currentAnime.episode_links[episode - 1]) {
        const player = document.getElementById('kodikPlayer');
        if (player) {
            player.src = currentAnime.episode_links[episode - 1];
        }
    }
}

// Поиск
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    let searchTimeout;
    
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        
        searchTimeout = setTimeout(() => {
            const searchTerm = this.value.toLowerCase().trim();
            
            if (searchTerm.length === 0) {
                renderAnimeList(animeList);
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
                    return anime.genres.some(genre => 
                        genre.toLowerCase().includes(searchTerm)
                    );
                }
                
                return false;
            });
            
            renderAnimeList(filtered);
        }, 300);
    });
}

// Сортировка
function initSorting() {
    const sortSelect = document.getElementById('sortSelect');
    if (!sortSelect) return;
    
    sortSelect.addEventListener('change', function() {
        let sortedList = [...animeList];
        
        switch (this.value) {
            case 'new':
                sortedList.sort((a, b) => (b.year || 0) - (a.year || 0));
                break;
            case 'popular':
                sortedList.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
                break;
            case 'rating':
                sortedList.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'name':
                sortedList.sort((a, b) => {
                    const titleA = a.title || '';
                    const titleB = b.title || '';
                    return titleA.localeCompare(titleB, 'ru');
                });
                break;
        }
        
        renderAnimeList(sortedList);
    });
}

// Фильтры
function initFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn[data-filter]');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Убираем активный класс у всех кнопок
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Добавляем активный класс нажатой кнопке
            this.classList.add('active');
            
            const filterType = this.dataset.filter;
            filterAnimeList(filterType);
        });
    });
}

// Быстрые фильтры
function initQuickFilters() {
    const quickFilters = document.querySelectorAll('.quick-filter');
    
    quickFilters.forEach(filter => {
        filter.addEventListener('click', function() {
            // Убираем активный класс у всех кнопок
            quickFilters.forEach(btn => btn.classList.remove('active'));
            // Добавляем активный класс нажатой кнопке
            this.classList.add('active');
            
            const genre = this.textContent;
            if (genre === 'Все жанры') {
                renderAnimeList(animeList);
            } else {
                const filtered = animeList.filter(anime => 
                    anime.genres && anime.genres.includes(genre)
                );
                renderAnimeList(filtered);
            }
        });
    });
}

// Фильтрация аниме
function filterAnimeList(filterType) {
    let filteredList = [...animeList];
    
    switch (filterType) {
        case 'ongoing':
            filteredList = filteredList.filter(anime => 
                anime.status && anime.status.toLowerCase() === 'ongoing'
            );
            break;
        case 'completed':
            filteredList = filteredList.filter(anime => 
                anime.status && anime.status.toLowerCase() === 'completed'
            );
            break;
        case 'movies':
            filteredList = filteredList.filter(anime => 
                anime.type && anime.type.toLowerCase().includes('фильм')
            );
            break;
        default:
            // Все - ничего не фильтруем
            break;
    }
    
    renderAnimeList(filteredList);
}

// Пагинация
function initPagination() {
    const pageButtons = document.querySelectorAll('.page-btn:not(.prev):not(.next)');
    
    pageButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Убираем активный класс у всех кнопок
            pageButtons.forEach(btn => btn.classList.remove('active'));
            // Добавляем активный класс нажатой кнопке
            this.classList.add('active');
            
            // Здесь можно добавить логику загрузки страницы
            console.log('Переход на страницу:', this.textContent);
        });
    });
}

// Переключение темы
function initThemeToggle() {
    const themeToggle = document.querySelector('.theme-toggle');
    if (!themeToggle) return;
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        // Переключение темы
        document.body.classList.toggle('dark-theme');
        
        // Сохранение темы в localStorage
        localStorage.setItem('theme', newTheme);
        
        // Обновление текста кнопки
        const icon = themeToggle.querySelector('i');
        const text = themeToggle.querySelector('span') || themeToggle;
        
        if (newTheme === 'dark') {
            icon.className = 'fas fa-moon';
            if (text.tagName === 'SPAN') {
                text.textContent = 'Тёмная тема';
            } else {
                themeToggle.innerHTML = '<i class="fas fa-moon"></i> Тёмная тема';
            }
        } else {
            icon.className = 'fas fa-sun';
            if (text.tagName === 'SPAN') {
                text.textContent = 'Светлая тема';
            } else {
                themeToggle.innerHTML = '<i class="fas fa-sun"></i> Светлая тема';
            }
        }
    });
    
    // Загрузка сохранённой темы
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.remove('dark-theme');
        const icon = themeToggle.querySelector('i');
        const text = themeToggle.querySelector('span') || themeToggle;
        icon.className = 'fas fa-sun';
        if (text.tagName === 'SPAN') {
            text.textContent = 'Светлая тема';
        } else {
            themeToggle.innerHTML = '<i class="fas fa-sun"></i> Светлая тема';
        }
    }
}

// Вспомогательные функции
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

function getRatingColor(rating) {
    if (rating >= 8.5) return 'linear-gradient(45deg, #28a745, #20c997)';
    if (rating >= 7.0) return 'linear-gradient(45deg, #17a2b8, #20c997)';
    if (rating >= 5.0) return 'linear-gradient(45deg, #ffc107, #fd7e14)';
    return 'linear-gradient(45deg, #dc3545, #fd7e14)';
}

function getStatusText(status) {
    if (!status) return 'Неизвестно';
    
    const statusMap = {
        'Завершен': 'Завершен',
        'Анонсирован': 'Анонсирован',
        'онгоинг': 'Онгоинг',
    };
    
    return statusMap[status.toLowerCase()] || status;
}

function getAnimeBadge(anime) {
    if (anime.status === 'ongoing') return 'Онгоинг';
    if (anime.rating >= 8.5) return 'Топ';
    if (anime.year >= new Date().getFullYear() - 1) return 'Новинка';
    return null;
}

// Экспортируем функции для использования в консоли
window.loadAnimeList = loadAnimeList;
