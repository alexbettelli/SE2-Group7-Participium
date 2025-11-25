export const not_found_url = './not_found.jpg';

export const setSrcToNotFound = (e) => {
    if(e.target.src !== not_found_url) e.target.src = not_found_url;
}