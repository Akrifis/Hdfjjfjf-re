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
            if (navMenu.classList.contains('active') && 
                !navMenu.contains(event.target) && 
                !hamburger.contains(event.target)) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
        
        // Закрытие меню при нажатии ESC
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && navMenu.classList.contains('active')) {
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
            errorElement.innerHTML = `
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>Ошибка загрузки</h3>
                <p>Не удалось загрузить список аниме. Проверьте:</p>
                <ol style="text-align: left; margin: 20px auto; max-width: 400px;">
                    <li>Подключение к интернету</li>
                    <li>Настройки репозитория GitHub</li>
                    <li>Формат файла anime_list.json</li>
                </ol>
                <button id="retryBtn" class="retry-btn">
                    <i class="fas fa-redo"></i> Попробовать снова
                </button>
            `;
            
            // Перепривязываем обработчик к новой кнопке
            document.getElementById('retryBtn')?.addEventListener('click', loadAnimeList);
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
    
    // Используем изображение-заглушку, если постер не указан
    const posterUrl = anime.poster || 'https://via.placeholder.com/280x350/0f1e2d/ffffff?text=No+Image';
    
    card.innerHTML = `
        <div class="anime-poster-container">
            <img src="${posterUrl}" alt="${anime.title}" class="anime-poster" 
                 onerror="this.src='https://via.placeholder.com/280x350/0f1e2d/ffffff?text=No+Image'">
            <div class="anime-overlay"></div>
            ${anime.status === 'ongoing' ? '<div class="anime-badge">Онгоинг</div>' : ''}
        </div>
        <div class="anime-content">
            <h3 class="anime-title">${anime.title}</h3>
            <div class="anime-meta">
                <span class="anime-rating">
                    <i class="fas fa-star"></i> ${anime.rating || 'Н/Д'}
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
                <p>Ссылка на плеер не указана в данных аниме</p>
            </div>
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
                if (currentEpisode) currentEpisode.textContent = i;
                
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

// Функция для кнопки "Поделиться"
function shareAnime() {
    if (navigator.share) {
        navigator.share({
            title: currentAnime?.title || 'Аниме',
            text: `Смотри это аниме на Re:Voice Anime`,
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
